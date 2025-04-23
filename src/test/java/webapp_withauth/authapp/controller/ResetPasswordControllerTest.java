package webapp_withauth.authapp.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import webapp_withauth.authapp.model.PasswordResetToken;
import webapp_withauth.authapp.model.User;
import webapp_withauth.authapp.repository.PasswordResetTokenRepository;
import webapp_withauth.authapp.repository.UserRepository;
import webapp_withauth.authapp.service.EmailService;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ResetPasswordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PasswordResetTokenRepository resetTokenRepository;

    @MockBean
    private UserRepository userRepo;

    @MockBean
    private PasswordEncoder encoder;

    @MockBean
    private EmailService emailService;

    // valid token → password updated
    @Test
    void resetPassword_validToken_updatesPassword() throws Exception {
        String token = "valid-token";
        String email = "user@example.com";
        String newPassword = "newpass123";

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .email(email)
                .expiry(LocalDateTime.now().plusMinutes(5))
                .build();

        User user = new User();
        user.setEmail(email);
        user.setPassword("oldpassword");

        when(resetTokenRepository.findByToken(token)).thenReturn(Optional.of(resetToken));
        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(encoder.encode(newPassword)).thenReturn("encodedNewPassword");

        mockMvc.perform(post("/auth/reset-password")
                .param("token", token)
                .param("newPassword", newPassword)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(status().isOk());

        verify(userRepo).save(user);
        verify(resetTokenRepository).deleteByEmail(email);
        verify(emailService).send(eq(email), any(), contains("Your password was successfully reset"));
    }

    // expired token → 410
    @Test
    void resetPassword_expiredToken_returns410() throws Exception {
        String token = "expired-token";
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .email("user@example.com")
                .expiry(LocalDateTime.now().minusMinutes(1))
                .build();

        when(resetTokenRepository.findByToken(token)).thenReturn(Optional.of(resetToken));

        mockMvc.perform(post("/auth/reset-password")
                .param("token", token)
                .param("newPassword", "irrelevant")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(status().isGone());
    }

    // user not found → 404
    @Test
    void resetPassword_userNotFound_returns404() throws Exception {
        String token = "token-for-missing-user";
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .email("ghost@example.com")
                .expiry(LocalDateTime.now().plusMinutes(5))
                .build();

        when(resetTokenRepository.findByToken(token)).thenReturn(Optional.of(resetToken));
        when(userRepo.findByEmail(resetToken.getEmail())).thenReturn(Optional.empty());

        mockMvc.perform(post("/auth/reset-password")
                .param("token", token)
                .param("newPassword", "doesnotmatter")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(status().isNotFound());
    }

    // invalid token → 404
    @Test
    void resetPassword_invalidToken_returns404() throws Exception {
        when(resetTokenRepository.findByToken("invalid")).thenReturn(Optional.empty());

        mockMvc.perform(post("/auth/reset-password")
                .param("token", "invalid")
                .param("newPassword", "somepass")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(status().isNotFound());
    }
}