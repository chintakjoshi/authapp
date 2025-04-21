package webapp_withauth.authapp.model;

import lombok.Data;

@Data
public class ResendOtpRequest {
    private String email;
}