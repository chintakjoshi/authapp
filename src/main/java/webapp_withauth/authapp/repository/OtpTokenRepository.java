package webapp_withauth.authapp.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import webapp_withauth.authapp.model.OtpToken;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findByEmail(String email);

    void deleteByEmail(String email);
}