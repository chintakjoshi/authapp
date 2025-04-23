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
import webapp_withauth.authapp.model.RegisterRequest;
import webapp_withauth.authapp.model.User;
import webapp_withauth.authapp.security.JwtService;
import webapp_withauth.authapp.service.EmailService;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
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

        @MockBean
        private EmailService emailService;

        private final ObjectMapper mapper = new ObjectMapper();

        private Authentication buildAuth(User user) {
                return new UsernamePasswordAuthenticationToken(user, user.getPassword(), Collections.emptyList());
        }

        // valid credentials → expect 200 and tokens
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

                UserDetails mockUserDetails = org.springframework.security.core.userdetails.User.builder()
                                .username("testuser")
                                .password("password")
                                .roles("USER")
                                .build();

                Authentication mockAuth = mock(Authentication.class);
                when(mockAuth.getName()).thenReturn("testuser");
                when(mockAuth.getPrincipal()).thenReturn(mockUserDetails);

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

        // invalid password → expect 401
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

        // unverified user → expect 401
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

        // non-existent user → expect 401
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

        // valid registration → 200 OK + OTP email
        @Test
        void register_validRequest_returns200AndSendsOtp() throws Exception {
                RegisterRequest req = new RegisterRequest();
                req.setUsername("newuser");
                req.setEmail("newuser@example.com");
                req.setPassword("securepass");
                req.setConfirmPassword("securepass");

                mockMvc.perform(post("/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(req)))
                                .andExpect(status().isOk())
                                .andExpect(content().string("OTP sent to your email"));

                verify(emailService, times(1)).send(eq("newuser@example.com"), anyString(), contains("OTP"));
        }

        // duplicate username or email → 400
        @Test
        @Sql(statements = {
                        "INSERT INTO users (id, username, email, password, role, enabled) " +
                                        "VALUES (4, 'dupeuser', 'dupe@example.com', 'hashed', 'USER', true)"
        })
        void register_duplicateUsernameOrEmail_returns400() throws Exception {
                RegisterRequest req = new RegisterRequest();
                req.setUsername("dupeuser");
                req.setEmail("dupe@example.com");
                req.setPassword("pass");
                req.setConfirmPassword("pass");

                mockMvc.perform(post("/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(req)))
                                .andExpect(status().isBadRequest());
        }

        // password mismatch → 400
        @Test
        void register_passwordMismatch_returns400() throws Exception {
                RegisterRequest req = new RegisterRequest();
                req.setUsername("user");
                req.setEmail("user@example.com");
                req.setPassword("abc");
                req.setConfirmPassword("xyz");

                mockMvc.perform(post("/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(req)))
                                .andExpect(status().isBadRequest())
                                .andExpect(content().string("Passwords do not match"));
        }

        // already pending with same email → should replace old pending user
        @Test
        @Sql(statements = {
                        "DELETE FROM pending_users",
                        "INSERT INTO pending_users (id, username, email, encoded_password, otp, expiry, otp_sent_at) " +
                                        "VALUES (1, 'olduser', 'pending@example.com', 'oldpass', '123456', now(), now())"
        })                   
        void register_existingPendingUser_isReplaced() throws Exception {
                RegisterRequest req = new RegisterRequest();
                req.setUsername("olduser");
                req.setEmail("pending@example.com");
                req.setPassword("newpass");
                req.setConfirmPassword("newpass");

                mockMvc.perform(post("/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mapper.writeValueAsString(req)))
                                .andExpect(status().isOk())
                                .andExpect(content().string("OTP sent to your email"));

                verify(emailService, times(1)).send(eq("pending@example.com"), any(), contains("OTP"));
        }
}