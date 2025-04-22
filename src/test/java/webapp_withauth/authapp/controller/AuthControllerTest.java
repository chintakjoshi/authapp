package webapp_withauth.authapp.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import webapp_withauth.authapp.model.AuthRequest;
import webapp_withauth.authapp.model.User;
import webapp_withauth.authapp.security.JwtService;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private JwtService jwtService;

    private final ObjectMapper mapper = new ObjectMapper();

    private Authentication buildAuth(User user) {
        return new UsernamePasswordAuthenticationToken(user, user.getPassword(), Collections.emptyList());
    }

    @Test
    @Sql(statements = {
                    "INSERT INTO users (id, username, email, password, role, enabled) " +
                                    "VALUES (1, 'testuser', 'test@example.com', " +
                                    "'$2a$10$7eqJtq98hPqEX7fNZaFWoO4Q13w9PO9uCzxeV6rV5pD4dIaIRZXsy', 'USER', true)"
    })
    void login_validCredentials_returnsTokens() throws Exception {
            AuthRequest request = new AuthRequest();
            request.setUsername("testuser");
            request.setPassword("password");
            request.setDeviceId("device123");

            // Mock UserDetails
            UserDetails mockUserDetails = org.springframework.security.core.userdetails.User.builder()
                            .username("testuser")
                            .password("password")
                            .roles("USER")
                            .build();

            // Mock Authentication object
            Authentication mockAuth = mock(Authentication.class);
            when(mockAuth.getName()).thenReturn("testuser");
            when(mockAuth.getPrincipal()).thenReturn(mockUserDetails);

            // Return the mock auth from the authentication manager
            when(authenticationManager.authenticate(any())).thenReturn(mockAuth);

            when(jwtService.generateAccessToken(any())).thenReturn("mock-access-token");
            when(jwtService.generateRefreshToken(any())).thenReturn("mock-refresh-token");

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(request)))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.accessToken").value("mock-access-token"))
                            .andExpect(jsonPath("$.refreshToken").value("mock-refresh-token"));
    }

    @Test
    @Sql(statements = {
        "INSERT INTO users (id, username, email, password, role, enabled) " +
        "VALUES (2, 'testuser2', 'test2@example.com', " +
        "'$2a$10$7eqJtq98hPqEX7fNZaFWoO4Q13w9PO9uCzxeV6rV5pD4dIaIRZXsy', 'USER', true)"
    })
    void login_invalidPassword_returns401() throws Exception {
        AuthRequest request = new AuthRequest();
        request.setUsername("testuser2");
        request.setPassword("wrongpassword");
        request.setDeviceId("device123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Sql(statements = {
        "INSERT INTO users (id, username, email, password, role, enabled) " +
        "VALUES (3, 'unverifieduser', 'unverified@example.com', " +
        "'$2a$10$7eqJtq98hPqEX7fNZaFWoO4Q13w9PO9uCzxeV6rV5pD4dIaIRZXsy', 'USER', false)"
    })
    void login_unverifiedUser_returns401() throws Exception {
        AuthRequest request = new AuthRequest();
        request.setUsername("unverifieduser");
        request.setPassword("password");
        request.setDeviceId("device123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("User not verified"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_nonExistentUser_returns401() throws Exception {
        AuthRequest request = new AuthRequest();
        request.setUsername("ghostuser");
        request.setPassword("password");
        request.setDeviceId("device123");

        User ghostUser = User.builder()
                .username("ghostuser")
                .password("hashed")
                .role("USER")
                .enabled(true)
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(buildAuth(ghostUser));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
