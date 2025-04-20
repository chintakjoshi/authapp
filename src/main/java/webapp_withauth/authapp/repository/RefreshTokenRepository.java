package webapp_withauth.authapp.repository;

import webapp_withauth.authapp.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    void deleteByToken(String token);

    void deleteAllByUsername(String username);

    void deleteAllByExpiryBefore(LocalDateTime now);
}