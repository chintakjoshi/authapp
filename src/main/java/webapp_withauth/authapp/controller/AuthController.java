package webapp_withauth.authapp.controller;

import webapp_withauth.authapp.model.*;
import webapp_withauth.authapp.repository.OtpTokenRepository;
import webapp_withauth.authapp.repository.UserRepository;
import webapp_withauth.authapp.security.JwtService;
import webapp_withauth.authapp.service.EmailService;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;

import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final UserRepository userRepo;
    private final OtpTokenRepository otpTokenRepo;
    private final EmailService emailService;
    private final PasswordEncoder encoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest req) {
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
        return ResponseEntity.ok(new AuthResponse(accessToken, refreshToken));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody RefreshRequest req) {
        String refreshToken = req.getRefreshToken();
        String username = jwtService.extractUsername(refreshToken);
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

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body("Passwords do not match");
        }

        if (userRepo.existsByUsername(request.getUsername()) || userRepo.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Username or email already in use");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(encoder.encode(request.getPassword()))
                .role("USER")
                .enabled(false)
                .build();

        userRepo.save(user);

        String otp = String.valueOf(new Random().nextInt(9000) + 1000); // 4-digit
        otpTokenRepo.deleteByEmail(user.getEmail());
        otpTokenRepo.save(OtpToken.builder()
                .email(user.getEmail())
                .otp(otp)
                .expiry(LocalDateTime.now().plusMinutes(5))
                .build());

        emailService.send(
                user.getEmail(),
                "Verify your account",
                "Your OTP is: " + otp);

        return ResponseEntity.ok("OTP sent to your email");
    }

    @PostMapping("/verify")
    @Transactional
    public ResponseEntity<?> verify(@RequestParam String email, @RequestParam String otp) {
        OtpToken token = otpTokenRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No OTP found"));

        if (!token.getOtp().equals(otp)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid OTP");
        }

        if (token.getExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.GONE).body("OTP expired");
        }

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(true);
        userRepo.save(user);
        otpTokenRepo.deleteByEmail(email);

        emailService.send(
                email,
                "Your account is verified",
                "✅ Welcome to AuthApp!\nYour account is now verified. You can log in here: http://localhost/login");

        return ResponseEntity.ok("Your email is verified. You can now log in.");
    }
}