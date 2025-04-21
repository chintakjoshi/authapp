package webapp_withauth.authapp.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pending_users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String encodedPassword;

    @Column(nullable = false)
    private String otp;

    @Column(nullable = false)
    private LocalDateTime otpSentAt;

    @Column(nullable = false)
    private LocalDateTime expiry;
}