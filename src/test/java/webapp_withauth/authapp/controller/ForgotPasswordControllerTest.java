package webapp_withauth.authapp.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import webapp_withauth.authapp.model.PasswordResetToken;
import webapp_withauth.authapp.model.User;
import webapp_withauth.authapp.repository.PasswordResetTokenRepository;
import webapp_withauth.authapp.repository.UserRepository;
import webapp_withauth.authapp.service.EmailService;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ForgotPasswordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepo;

    @MockBean
    private PasswordResetTokenRepository resetTokenRepo;

    @MockBean
    private EmailService emailService;

    // Known email → token created, email sent
    @Test
    void forgotPassword_knownEmail_createsTokenAndSendsEmail() throws Exception {
        String email = "known@example.com";
        User user = User.builder().id(1L).email(email).username("knownuser").build();

        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(resetTokenRepo.findByEmail(email)).thenReturn(Optional.empty());

        mockMvc.perform(post("/auth/forgot-password")
                .param("email", email)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(status().isOk())
                .andExpect(content().string("If the email exists, a reset link has been sent."));

        verify(resetTokenRepo).deleteByEmail(email);
        verify(resetTokenRepo).save(any(PasswordResetToken.class));
        verify(emailService).send(eq(email), contains("Reset your password"),
                contains("http://localhost/reset-password?token="));
    }

    // Unknown email → still returns 200 (security)
    @Test
    void forgotPassword_unknownEmail_returns200NoLeak() throws Exception {
        String email = "unknown@example.com";

        when(userRepo.findByEmail(email)).thenReturn(Optional.empty());

        mockMvc.perform(post("/auth/forgot-password")
                .param("email", email)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(status().isOk())
                .andExpect(content().string("If the email exists, a reset link will be sent."));

        verifyNoInteractions(resetTokenRepo);
        verifyNoInteractions(emailService);
    }

    // Resend before 3 min → 429
    @Test
    void forgotPassword_resendBeforeThrottleWindow_returns429() throws Exception {
        String email = "throttle@example.com";
        User user = User.builder().id(2L).email(email).username("throttled").build();
        PasswordResetToken token = PasswordResetToken.builder()
                .email(email)
                .token(UUID.randomUUID().toString())
                .sentAt(LocalDateTime.now().minusMinutes(2))
                .expiry(LocalDateTime.now().plusMinutes(13))
                .build();

        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(resetTokenRepo.findByEmail(email)).thenReturn(Optional.of(token));

        mockMvc.perform(post("/auth/forgot-password")
                .param("email", email)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(status().isTooManyRequests())
                .andExpect(content().string("You can request a reset link only every 3 minutes"));

        verify(resetTokenRepo, never()).deleteByEmail(email);
        verify(emailService, never()).send(any(), any(), any());
    }
}