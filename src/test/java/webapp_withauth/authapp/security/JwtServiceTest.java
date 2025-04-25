package webapp_withauth.authapp.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.Date;
import java.security.Key;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private final JwtService jwtService;

    public JwtServiceTest() {
        jwtService = new JwtService();
        setField(jwtService, "secret", "supersecurelongenoughsecretkey123456");
        callValidateSecretInternal(jwtService);
    }

    private void setField(Object target, String fieldName, String value) {
        try {
            Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void callValidateSecretInternal(JwtService jwtService) {
        try {
            Method method = JwtService.class.getDeclaredMethod("validateSecretInternal");
            method.setAccessible(true);
            method.invoke(jwtService);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private UserDetails user() {
        return User.builder()
                .username("testuser")
                .password("ignored")
                .roles("USER")
                .build();
    }

    // Valid token generation/parsing
    @Test
    void validToken_shouldPassParsingAndValidation() {
        String token = jwtService.generateAccessToken(user());

        String username = jwtService.extractUsername(token);
        boolean valid = jwtService.isTokenValid(token, user());

        assertEquals("testuser", username);
        assertTrue(valid);
    }

    // Invalid/malformed token
    @Test
    void malformedToken_shouldThrow() {
        String token = "malformed.jwt.token";

        assertThrows(JwtException.class, () -> jwtService.extractUsername(token));
    }

    // Expired token
    @Test
    void expiredToken_shouldBeRejected() {
        Key key = Keys.hmacShaKeyFor("supersecurelongenoughsecretkey123456".getBytes());
        String token = Jwts.builder()
                .setSubject("testuser")
                .setIssuedAt(Date.from(Instant.now().minusSeconds(600)))
                .setExpiration(Date.from(Instant.now().minusSeconds(300))) // already expired
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        assertThrows(ExpiredJwtException.class, () -> jwtService.extractUsername(token));
    }

    // Secret too short → exception on startup
    @Test
    void shortSecret_shouldFailStartup() {
        ApplicationContextRunner runner = new ApplicationContextRunner()
                .withBean(JwtService.class)
                .withPropertyValues("jwt.secret=short");

        runner.run(context -> {
            assertThrows(IllegalStateException.class, () -> context.getBean(JwtService.class));
        });
    }
}