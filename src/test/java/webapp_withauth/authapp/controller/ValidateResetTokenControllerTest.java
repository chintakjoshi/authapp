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
import webapp_withauth.authapp.model.PasswordResetToken;
import webapp_withauth.authapp.model.RefreshRequest;
import webapp_withauth.authapp.repository.PasswordResetTokenRepository;
import webapp_withauth.authapp.repository.RefreshTokenRepository;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ValidateResetTokenControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PasswordResetTokenRepository resetTokenRepository;

    @MockBean
    private RefreshTokenRepository refreshTokenRepository;

    private final ObjectMapper mapper = new ObjectMapper();

    // valid → 200
    @Test
    void validateResetToken_validToken_returns200() throws Exception {
        var token = new PasswordResetToken();
        token.setToken("valid.token.123");
        token.setExpiry(LocalDateTime.now().plusMinutes(5));

        when(resetTokenRepository.findByToken("valid.token.123")).thenReturn(Optional.of(token));

        mockMvc.perform(get("/auth/validate-reset-token")
                .param("token", "valid.token.123"))
                .andExpect(status().isOk())
                .andExpect(content().string("Token is valid"));
    }

    // invalid → 404
    @Test
    void validateResetToken_invalidToken_returns404() throws Exception {
        when(resetTokenRepository.findByToken("invalid.token.456")).thenReturn(Optional.empty());

        mockMvc.perform(get("/auth/validate-reset-token")
                .param("token", "invalid.token.456"))
                .andExpect(status().isNotFound());
    }

    // expired → 410
    @Test
    void validateResetToken_expiredToken_returns410() throws Exception {
        var token = new PasswordResetToken();
        token.setToken("expired.token.789");
        token.setExpiry(LocalDateTime.now().minusMinutes(1));

        when(resetTokenRepository.findByToken("expired.token.789")).thenReturn(Optional.of(token));

        mockMvc.perform(get("/auth/validate-reset-token")
                .param("token", "expired.token.789"))
                .andExpect(status().isGone())
                .andExpect(content().string("Token expired"));
    }

    // token deleted after logout
    @Test
    void logout_tokenDeleted_returns200() throws Exception {
        RefreshRequest logoutRequest = new RefreshRequest("dummy.logout.token", "irrelevant");
        mockMvc.perform(post("/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isOk())
                .andExpect(content().string("Logged out"));

        verify(refreshTokenRepository).deleteByToken("dummy.logout.token");
    }
}