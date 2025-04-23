package webapp_withauth.authapp.controller;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import webapp_withauth.authapp.model.PendingUser;
import webapp_withauth.authapp.repository.PendingUserRepository;
import webapp_withauth.authapp.repository.UserRepository;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class VerifyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PendingUserRepository pendingUserRepo;

    @Autowired
    private UserRepository userRepo;

    @BeforeEach
    void cleanDb() {
        userRepo.deleteAll();
        pendingUserRepo.deleteAll();
    }

    // valid OTP → 200 and user is saved
    @Test
    @Order(1)
    void verify_validOtp_returns200() throws Exception {
        pendingUserRepo.save(PendingUser.builder()
                .username("newuser")
                .email("verify@example.com")
                .encodedPassword("$2a$10$somehashhere")
                .otp("654321")
                .expiry(LocalDateTime.now().plusMinutes(10))
                .otpSentAt(LocalDateTime.now())
                .build());

        mockMvc.perform(post("/auth/verify")
                .param("email", "verify@example.com")
                .param("otp", "654321"))
                .andExpect(status().isOk())
                .andExpect(content().string("Your email is verified. You can now log in."));
    }

    // wrong OTP → 401
    @Test
    @Order(2)
    void verify_wrongOtp_returns401() throws Exception {
        pendingUserRepo.save(PendingUser.builder()
                .username("newuser2")
                .email("wrongotp@example.com")
                .encodedPassword("$2a$10$somehashhere")
                .otp("111111")
                .expiry(LocalDateTime.now().plusMinutes(10))
                .otpSentAt(LocalDateTime.now())
                .build());

        mockMvc.perform(post("/auth/verify")
                .param("email", "wrongotp@example.com")
                .param("otp", "000000"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Invalid OTP"));
    }

    // expired OTP → 410
    @Test
    @Order(3)
    void verify_expiredOtp_returns410() throws Exception {
        pendingUserRepo.save(PendingUser.builder()
                .username("newuser3")
                .email("expired@example.com")
                .encodedPassword("$2a$10$somehashhere")
                .otp("222222")
                .expiry(LocalDateTime.now().minusMinutes(10))
                .otpSentAt(LocalDateTime.now().minusMinutes(10))
                .build());

        mockMvc.perform(post("/auth/verify")
                .param("email", "expired@example.com")
                .param("otp", "222222"))
                .andExpect(status().isGone())
                .andExpect(content().string("OTP expired"));
    }

    // email not in pending users → 404
    @Test
    @Order(4)
    void verify_nonExistentEmail_returns404() throws Exception {
        mockMvc.perform(post("/auth/verify")
                .param("email", "ghost@example.com")
                .param("otp", "999999"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(""));
    }
}