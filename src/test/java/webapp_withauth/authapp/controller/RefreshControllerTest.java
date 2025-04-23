package webapp_withauth.authapp.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import webapp_withauth.authapp.model.RefreshRequest;
import webapp_withauth.authapp.security.JwtService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.when;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class RefreshControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtService jwtService;

    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void setupMocks() {
        when(jwtService.extractUsername(anyString())).thenAnswer(invocation -> {
            String token = invocation.getArgument(0);
            return switch (token) {
                case "dummy.token.100" -> "testuser";
                case "dummy.token.101" -> "revokeduser";
                case "dummy.token.102" -> "wrongdeviceuser";
                case "dummy.token.103" -> "expireduser";
                default -> null;
            };
        });

        when(jwtService.isTokenValid(anyString(), any())).thenAnswer(invocation -> {
            String token = invocation.getArgument(0);
            return token.equals("dummy.token.100");
        });

        when(jwtService.generateAccessToken(any())).thenReturn("mocked.access.token");
    }

    // valid refresh token + device match → new access token
    @Test
    @Sql(statements = {
            "INSERT INTO users (id, username, email, password, role, enabled) VALUES (10, 'testuser', 'refresh@example.com', '$2a$10$validhashed', 'USER', true)",
            "INSERT INTO refresh_token (id, username, token, expiry, revoked, ip, user_agent, device_id) " +
                    "VALUES (100, 'testuser', 'dummy.token.100', DATEADD('DAY', 1, CURRENT_TIMESTAMP), false, '127.0.0.1', 'JUnit', 'device123')"
    })
    void refresh_validTokenAndDevice_returnsAccessToken() throws Exception {
        RefreshRequest request = new RefreshRequest("dummy.token.100", "device123");

        mockMvc.perform(post("/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists());
    }

    // invalid token → 401
    @Test
    void refresh_invalidToken_returns401() throws Exception {
        RefreshRequest request = new RefreshRequest("invalid.token.structure", "device123");

        mockMvc.perform(post("/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // revoked token → 401
    @Test
    @Sql(statements = {
            "INSERT INTO users (id, username, email, password, role, enabled) VALUES (11, 'revokeduser', 'revoked@example.com', '$2a$10$validhashed', 'USER', true)",
            "INSERT INTO refresh_token (id, username, token, expiry, revoked, ip, user_agent, device_id) " +
                    "VALUES (101, 'revokeduser', 'dummy.token.101', DATEADD('DAY', 1, CURRENT_TIMESTAMP), true, '127.0.0.1', 'JUnit', 'device123')"
    })
    void refresh_revokedToken_returns401() throws Exception {
        RefreshRequest request = new RefreshRequest("dummy.token.101", "device123");

        mockMvc.perform(post("/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // device mismatch → 401
    @Test
    @Sql(statements = {
            "INSERT INTO users (id, username, email, password, role, enabled) VALUES (12, 'wrongdeviceuser', 'wrongdevice@example.com', '$2a$10$validhashed', 'USER', true)",
            "INSERT INTO refresh_token (id, username, token, expiry, revoked, ip, user_agent, device_id) " +
                    "VALUES (102, 'wrongdeviceuser', 'dummy.token.102', DATEADD('DAY', 1, CURRENT_TIMESTAMP), false, '127.0.0.1', 'JUnit', 'device999')"
    })
    void refresh_deviceMismatch_returns401() throws Exception {
        RefreshRequest request = new RefreshRequest("dummy.token.102", "device123");

        mockMvc.perform(post("/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // expired token → 401
    @Test
    @Sql(statements = {
            "INSERT INTO users (id, username, email, password, role, enabled) VALUES (13, 'expireduser', 'expired@example.com', '$2a$10$validhashed', 'USER', true)",
            "INSERT INTO refresh_token (id, username, token, expiry, revoked, ip, user_agent, device_id) " +
                    "VALUES (103, 'expireduser', 'dummy.token.103', DATEADD('MINUTE', -1, CURRENT_TIMESTAMP), false, '127.0.0.1', 'JUnit', 'device123')"
    })
    void refresh_expiredToken_returns401() throws Exception {
        RefreshRequest request = new RefreshRequest("dummy.token.103", "device123");

        mockMvc.perform(post("/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}