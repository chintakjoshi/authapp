package webapp_withauth.authapp.controller;

import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import webapp_withauth.authapp.model.*;
import webapp_withauth.authapp.repository.*;
import webapp_withauth.authapp.security.JwtService;
import webapp_withauth.authapp.service.EmailService;

import jakarta.servlet.http.HttpServletRequest;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final UserRepository userRepo;
    private final EmailService emailService;
    private final PasswordEncoder encoder;
    private final PendingUserRepository pendingUserRepo;
    private final PasswordResetTokenRepository resetTokenRepo;
    private final RefreshTokenRepository refreshTokenRepo;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest req, HttpServletRequest request) {
        try {
            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));

            String username = auth.getName();

            User user = userRepo.findByUsername(username)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

            UserDetails springUser = org.springframework.security.core.userdetails.User.builder()
                    .username(user.getUsername())
                    .password(user.getPassword())
                    .roles(user.getRole())
                    .build();

            String accessToken = jwtService.generateAccessToken(springUser);
            String refreshToken = jwtService.generateRefreshToken(springUser);

            if (refreshToken == null || refreshToken.isBlank()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to generate refresh token");
            }

            storeRefreshToken(user.getUsername(), refreshToken, req.getDeviceId(), request);

            return ResponseEntity.ok(new AuthResponse(accessToken, refreshToken));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        }
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body("Passwords do not match");
        }

        pendingUserRepo.deleteByEmail(request.getEmail());

        if (userRepo.existsByUsername(request.getUsername()) || userRepo.existsByEmail(request.getEmail())
                        || pendingUserRepo.existsByUsername(request.getUsername())) {
                return ResponseEntity.badRequest().body("Username or email already in use");
        }

        SecureRandom secureRandom = new SecureRandom();
        String otp = String.valueOf(100000 + secureRandom.nextInt(900000));
        LocalDateTime now = LocalDateTime.now();

        pendingUserRepo.deleteByEmail(request.getEmail());
        pendingUserRepo.save(PendingUser.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .encodedPassword(encoder.encode(request.getPassword()))
                .otp(otp)
                .expiry(now.plusMinutes(5))
                .otpSentAt(now)
                .build());

        emailService.send(
                request.getEmail(),
                "Verify your account",
                "Your OTP for the registration is (This OTP will expire in 10 minutes): " + otp);

        return ResponseEntity.ok("OTP sent to your email");
    }

    @PostMapping("/refresh")
    @Transactional
    public ResponseEntity<?> refresh(@RequestBody RefreshRequest req, HttpServletRequest request) {
        String refreshToken = req.getRefreshToken();
        String username;
        try {
            username = jwtService.extractUsername(refreshToken);
        } catch (JwtException | IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        RefreshToken stored = refreshTokenRepo.findByToken(refreshToken)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token not found"));

        if (stored.isRevoked()
                || stored.getExpiry().isBefore(LocalDateTime.now())
                || !Objects.equals(stored.getDeviceId(), req.getDeviceId())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid device context");
        }

        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        UserDetails springUser = org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole())
                .build();

        if (!jwtService.isTokenValid(refreshToken, springUser, JwtService.REFRESH_TOKEN_TYPE)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        String newAccessToken = jwtService.generateAccessToken(springUser);
        String newRefreshToken = jwtService.generateRefreshToken(springUser);

        refreshTokenRepo.deleteByToken(refreshToken);
        storeRefreshToken(user.getUsername(), newRefreshToken, req.getDeviceId(), request);

        return ResponseEntity.ok(Map.of(
                "accessToken", newAccessToken,
                "refreshToken", newRefreshToken));
    }

    @PostMapping("/verify")
    @Transactional
    public ResponseEntity<?> verify(@RequestParam String email, @RequestParam String otp) {
        PendingUser pending = pendingUserRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No pending registration found"));

        if (!pending.getOtp().equals(otp)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid OTP");
        }

        if (pending.getExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.GONE).body("OTP expired");
        }

        userRepo.save(User.builder()
                .username(pending.getUsername())
                .email(pending.getEmail())
                .password(pending.getEncodedPassword())
                .role("USER")
                .enabled(true)
                .build());

        pendingUserRepo.deleteByEmail(email);

        emailService.send(
                email,
                "Your account is verified",
                "✅ Welcome to AuthApp!\nYour account is now verified. You can log in here: http://localhost/login");

        return ResponseEntity.ok("Your email is verified. You can now log in.");
    }

    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok("If the email exists, a reset link will be sent.");
        }

        Optional<PasswordResetToken> existingToken = resetTokenRepo.findByEmail(email);
        if (existingToken.isPresent()) {
            LocalDateTime lastSent = existingToken.get().getSentAt();
            if (lastSent != null && lastSent.isAfter(LocalDateTime.now().minusMinutes(3))) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body("You can request a reset link only every 3 minutes");
            }
        }

        String token = UUID.randomUUID().toString();
        resetTokenRepo.deleteByEmail(email);

        resetTokenRepo.save(PasswordResetToken.builder()
                .email(email)
                .token(token)
                .expiry(LocalDateTime.now().plusMinutes(15))
                .sentAt(LocalDateTime.now())
                .build());

        String link = "http://localhost/reset-password?token=" + token;
        emailService.send(email, "Reset your password",
                "Click here to reset your password (valid for 15 minutes): " + link);

        return ResponseEntity.ok("If the email exists, a reset link has been sent.");
    }

    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<?> resetPassword(@RequestParam String token, @RequestParam String newPassword) {
        PasswordResetToken resetToken = resetTokenRepo.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid reset token"));

        if (resetToken.getExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.GONE).body("Reset token expired");
        }

        User user = userRepo.findByEmail(resetToken.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setPassword(encoder.encode(newPassword));
        userRepo.save(user);
        refreshTokenRepo.deleteAllByUsername(user.getUsername());
        resetTokenRepo.deleteByEmail(user.getEmail());

        emailService.send(
                user.getEmail(),
                "Your password has been reset",
                """
                        🔒 Your password was successfully reset.

                        You can now log in using your new password:
                        http://localhost/login

                        If you did not perform this action, please contact support immediately.
                        """);

        return ResponseEntity.ok("Password reset successful. You can now log in.");
    }

    @PostMapping("/resend-otp")
    @Transactional
    public ResponseEntity<?> resendOtp(@RequestBody ResendOtpRequest req) {
        PendingUser pending = pendingUserRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No pending registration for this email"));

        if (pending.getOtpSentAt() != null && pending.getOtpSentAt().isAfter(LocalDateTime.now().minusMinutes(3))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body("You can request a new OTP only every 3 minutes");
        }

        SecureRandom secureRandom = new SecureRandom();
        String newOtp = String.valueOf(100000 + secureRandom.nextInt(900000));
        LocalDateTime now = LocalDateTime.now();

        pending.setOtp(newOtp);
        pending.setExpiry(now.plusMinutes(5));
        pending.setOtpSentAt(now);
        pendingUserRepo.save(pending);

        emailService.send(
                pending.getEmail(),
                "New OTP for verification",
                "Your new OTP is: " + newOtp + "\n(This OTP is valid for 5 minutes)");

        return ResponseEntity.ok("A new OTP has been sent to your email");
    }

    @PostMapping("/logout")
    @Transactional
    public ResponseEntity<?> logout(@RequestBody RefreshRequest req) {
        refreshTokenRepo.deleteByToken(req.getRefreshToken());
        return ResponseEntity.ok("Logged out");
    }

    @GetMapping("/validate-reset-token")
    public ResponseEntity<?> validateResetToken(@RequestParam String token) {
        PasswordResetToken resetToken = resetTokenRepo.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid token"));

        if (resetToken.getExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.GONE).body("Token expired");
        }

        return ResponseEntity.ok("Token is valid");
    }

    private void storeRefreshToken(String username, String refreshToken, String deviceId, HttpServletRequest request) {
        String ip = Optional.ofNullable(request.getHeader("X-Forwarded-For"))
                .orElseGet(request::getRemoteAddr);

        refreshTokenRepo.save(RefreshToken.builder()
                .username(username)
                .token(refreshToken)
                .expiry(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .ip(ip)
                .userAgent(request.getHeader("User-Agent"))
                .deviceId(deviceId)
                .build());
    }
}
