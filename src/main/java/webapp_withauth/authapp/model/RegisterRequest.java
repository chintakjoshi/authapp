package webapp_withauth.authapp.model;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String username;
    private String password;
    private String confirmPassword;
}