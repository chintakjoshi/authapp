package webapp_withauth.authapp.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class JwtAuthFilterTest {

    private JwtService jwtService;
    private UserDetailsService userDetailsService;
    private JwtAuthFilter jwtAuthFilter;
    private UserDetails user;
    private final String secret = "abcdefghijklmnopqrstuvwxyz0123456789!@#$";
    private Key key;

    @BeforeEach
    void setUp() throws Exception {
        jwtService = spy(new JwtService());
        userDetailsService = mock(UserDetailsService.class);
        jwtAuthFilter = new JwtAuthFilter(jwtService, userDetailsService);

        key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        user = User.builder()
                .username("testuser")
                .password("irrelevant")
                .roles("USER")
                .build();

        Field secretField = JwtService.class.getDeclaredField("secret");
        secretField.setAccessible(true);
        secretField.set(jwtService, secret);
    }

    private String generateToken(long millisOffset) {
        return Jwts.builder()
                .setSubject(user.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + millisOffset))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // Valid token in Authorization header → authenticated request
    @Test
    void validToken_setsAuthentication() throws Exception {
        String token = generateToken(15 * 60 * 1000);
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(user);
        doReturn("testuser").when(jwtService).extractUsername(token);
        doReturn(true).when(jwtService).isTokenValid(eq(token), any(), eq(JwtService.ACCESS_TOKEN_TYPE));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        jwtAuthFilter.doFilterInternal(request, response, chain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("testuser", SecurityContextHolder.getContext().getAuthentication().getName());
    }

    // No token → pass through
    @Test
    void noToken_passThrough() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        jwtAuthFilter.doFilterInternal(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    // Expired token → no authentication
    @Test
    void expiredToken_noAuthentication() throws Exception {
        String token = generateToken(-1000);
        doReturn("testuser").when(jwtService).extractUsername(token);
        doReturn(false).when(jwtService).isTokenValid(eq(token), any(), eq(JwtService.ACCESS_TOKEN_TYPE));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        jwtAuthFilter.doFilterInternal(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    // Token with invalid signature → reject
    @Test
    void invalidSignatureToken_noAuthentication() throws Exception {
        String token = generateToken(15 * 60 * 1000);
        doThrow(new io.jsonwebtoken.security.SignatureException("Invalid signature"))
                .when(jwtService).extractUsername(any());

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        jwtAuthFilter.doFilterInternal(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
