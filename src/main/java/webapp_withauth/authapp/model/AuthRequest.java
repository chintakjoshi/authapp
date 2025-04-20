package webapp_withauth.authapp.model;

import lombok.Data;

@Data
public class AuthRequest {
    private String username;
    private String password;
    private String deviceId;
}