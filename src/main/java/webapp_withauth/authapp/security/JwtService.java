package webapp_withauth.authapp.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @PostConstruct
    public void init() {
        validateSecretInternal();
    }

    private void validateSecretInternal() {
        if (secret == null || secret.isBlank()) {
            log.error("❌ JWT secret is missing. Application will not start.");
            throw new IllegalStateException("JWT secret must be provided and cannot be blank");
        }
        if (secret.length() < 32) {
            log.error("❌ JWT secret is too short (length {}). Minimum recommended length is 32 characters for HS256.",
                    secret.length());
            throw new IllegalStateException("JWT secret is too short. Minimum length is 32 characters.");
        }
        log.info("🔐 JWT secret loaded successfully (length: {}).", secret.length());
        log.debug("🔐 JWT secret (partial): {}*********", secret.substring(0, Math.min(4, secret.length())));
    }

    public String generateAccessToken(UserDetails user) {
        return Jwts.builder()
                .setSubject(user.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 15 * 60 * 1000)) // 15 minutes
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(UserDetails user) {
        return Jwts.builder()
                .setSubject(user.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 7L * 24 * 60 * 60 * 1000)) // 7 days
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        return userDetails.getUsername().equals(extractUsername(token)) && !isExpired(token);
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    private boolean isExpired(String token) {
        return parseClaims(token).getExpiration().before(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}