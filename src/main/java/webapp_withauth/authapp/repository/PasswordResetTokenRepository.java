package webapp_withauth.authapp.repository;

import webapp_withauth.authapp.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);

    void deleteByEmail(String email);

    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordResetToken t WHERE t.email = :email")
    void deleteAllByExpiryBefore(LocalDateTime time);
}