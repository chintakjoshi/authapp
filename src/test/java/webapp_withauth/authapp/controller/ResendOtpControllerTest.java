package webapp_withauth.authapp.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import webapp_withauth.authapp.model.PendingUser;
import webapp_withauth.authapp.model.ResendOtpRequest;
import webapp_withauth.authapp.repository.PendingUserRepository;
import webapp_withauth.authapp.service.EmailService;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ResendOtpControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PendingUserRepository pendingUserRepo;

    @MockBean
    private EmailService emailService;

    private final ObjectMapper mapper = new ObjectMapper();

    // valid case → OTP regenerated
    @Test
    void resendOtp_validRequest_generatesNewOtp() throws Exception {
        PendingUser user = new PendingUser();
        user.setEmail("test@example.com");
        user.setOtpSentAt(LocalDateTime.now().minusMinutes(5));
        when(pendingUserRepo.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        mockMvc.perform(post("/auth/resend-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new ResendOtpRequest("test@example.com"))))
                .andExpect(status().isOk())
                .andExpect(content().string("A new OTP has been sent to your email"));

        verify(emailService).send(eq("test@example.com"), contains("OTP"), contains("Your new OTP is"));
        verify(pendingUserRepo).save(any());
    }

    // cooldown violated → 429
    @Test
    void resendOtp_cooldownViolated_returns429() throws Exception {
        PendingUser user = new PendingUser();
        user.setEmail("test@example.com");
        user.setOtpSentAt(LocalDateTime.now().minusMinutes(1));
        when(pendingUserRepo.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        mockMvc.perform(post("/auth/resend-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new ResendOtpRequest("test@example.com"))))
                .andExpect(status().isTooManyRequests())
                .andExpect(content().string("You can request a new OTP only every 3 minutes"));

        verify(emailService, never()).send(any(), any(), any());
        verify(pendingUserRepo, never()).save(any());
    }

    // no pending user → 404
    @Test
    void resendOtp_noPendingUser_returns404() throws Exception {
        when(pendingUserRepo.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        mockMvc.perform(post("/auth/resend-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new ResendOtpRequest("missing@example.com"))))
                .andExpect(status().isNotFound());
    }
}