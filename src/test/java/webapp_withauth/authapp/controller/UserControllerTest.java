package webapp_withauth.authapp.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.jdbc.Sql.ExecutionPhase;
import org.springframework.test.web.servlet.MockMvc;
import webapp_withauth.authapp.security.JwtService;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Sql(executionPhase = ExecutionPhase.BEFORE_TEST_CLASS, statements = {
        "DELETE FROM users WHERE username = 'secureuser';",
        "INSERT INTO users (id, username, email, password, role, enabled) " +
                "VALUES (999, 'secureuser', 'secure@example.com', '$2a$10$validhashed', 'USER', true)"
})
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    private String validJwt;

    @BeforeEach
    void setup() {
        UserDetails userDetails = User.builder()
                .username("secureuser")
                .password("irrelevant")
                .roles("USER")
                .build();

        validJwt = jwtService.generateAccessToken(userDetails);
    }

    // valid JWT → 200
    @Test
    void secureEndpoint_withValidJWT_returns200() throws Exception {
        mockMvc.perform(get("/api/secure-endpoint")
                .header("Authorization", "Bearer " + validJwt)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // missing JWT → 401
    @Test
    void secureEndpoint_withoutJWT_returns401() throws Exception {
        mockMvc.perform(get("/api/secure-endpoint")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    // tampered JWT → 401 (should trigger signature failure internally, but return 401)
    @Test
    void secureEndpoint_withInvalidJWT_returns401() throws Exception {
        String invalidJwt = validJwt.substring(0, validJwt.length() - 3) + "abc";

        mockMvc.perform(get("/api/secure-endpoint")
                .header("Authorization", "Bearer " + invalidJwt)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}