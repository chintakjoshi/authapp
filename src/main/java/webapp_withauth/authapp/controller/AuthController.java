package webapp_withauth.authapp.controller;

import webapp_withauth.authapp.model.*;
import webapp_withauth.authapp.repository.PasswordResetTokenRepository;
import webapp_withauth.authapp.repository.PendingUserRepository;
import webapp_withauth.authapp.repository.RefreshTokenRepository;
import webapp_withauth.authapp.repository.UserRepository;
import webapp_withauth.authapp.security.JwtService;
import webapp_withauth.authapp.service.EmailService;
import lombok.RequiredArgsConstructor;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.transaction.annotation.Transactional;

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
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));

        User user = userRepo.findByUsername(req.getUsername()).orElseThrow();
        UserDetails springUser = org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole())
                .build();

        String accessToken = jwtService.generateAccessToken(springUser);
        String refreshToken = jwtService.generateRefreshToken(springUser);

        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null)
            ip = request.getRemoteAddr();

        refreshTokenRepo.save(RefreshToken.builder()
                .username(user.getUsername())
                .token(refreshToken)
                .expiry(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .ip(ip)
                .userAgent(request.getHeader("User-Agent"))
                .deviceId(req.getDeviceId())
                .build());

        return ResponseEntity.ok(new AuthResponse(accessToken, refreshToken));
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body("Passwords do not match");
        }

        if (userRepo.existsByUsername(request.getUsername()) || userRepo.existsByEmail(request.getEmail())
                || pendingUserRepo.existsByUsername(request.getUsername())
                || pendingUserRepo.existsByEmail(request.getEmail())) {
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
    public ResponseEntity<?> refresh(@RequestBody RefreshRequest req, HttpServletRequest request) {
        String refreshToken = req.getRefreshToken();
        String username = jwtService.extractUsername(refreshToken);

        Optional<RefreshToken> stored = refreshTokenRepo.findByToken(refreshToken);
        if (stored.isEmpty()
                || stored.get().isRevoked()
                || stored.get().getExpiry().isBefore(LocalDateTime.now())
                || !stored.get().getDeviceId().equals(req.getDeviceId())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid device context");
        }

        User user = userRepo.findByUsername(username).orElseThrow();
        UserDetails springUser = org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole())
                .build();

        if (!jwtService.isTokenValid(refreshToken, springUser)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh token");
        }

        String newAccessToken = jwtService.generateAccessToken(springUser);
        return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
    }

    @PostMapping("/verify")
    @Transactional
    public ResponseEntity<?> verify(@RequestParam String email, @RequestParam String otp) {
        PendingUser pending = pendingUserRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No pending registration found"));

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

        // Check if a recent token was already sent
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
                .orElseThrow(() -> new RuntimeException("Invalid reset token"));

        if (resetToken.getExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.GONE).body("Reset token expired");
        }

        User user = userRepo.findByEmail(resetToken.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(encoder.encode(newPassword));
        userRepo.save(user);
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
        Optional<PendingUser> pendingOpt = pendingUserRepo.findByEmail(req.getEmail());

        if (pendingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No pending registration for this email");
        }

        PendingUser pending = pendingOpt.get();

        // Enforce 3-minute resend cooldown
        if (pending.getOtpSentAt() != null && pending.getOtpSentAt().isAfter(LocalDateTime.now().minusMinutes(3))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body("You can request a new OTP only every 3 minutes");
        }

        // Generate new 6-digit OTP securely
        SecureRandom secureRandom = new SecureRandom();
        String newOtp = String.valueOf(100000 + secureRandom.nextInt(900000));
        LocalDateTime now = LocalDateTime.now();

        // Update OTP, expiry, and sent timestamp
        pending.setOtp(newOtp);
        pending.setExpiry(now.plusMinutes(5));
        pending.setOtpSentAt(now);
        pendingUserRepo.save(pending);

        // Send email
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
        Optional<PasswordResetToken> resetTokenOpt = resetTokenRepo.findByToken(token);
        if (resetTokenOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Invalid token");
        }

        if (resetTokenOpt.get().getExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.GONE).body("Token expired");
        }

        return ResponseEntity.ok("Token is valid");
    }
}