package webapp_withauth.authapp.model;

import lombok.Data;

@Data
public class RefreshRequest {
    private String refreshToken;
}