package webapp_withauth.authapp.repository;

import webapp_withauth.authapp.model.PendingUser;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PendingUserRepository extends JpaRepository<PendingUser, Long> {

    Optional<PendingUser> findByEmail(String email);

    Optional<PendingUser> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    void deleteByEmail(String email);

    @Modifying
    @Transactional
    @Query("DELETE FROM PendingUser p WHERE p.expiry < :now")
    void deleteExpired(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(p) FROM PendingUser p WHERE p.expiry < :now")
    long countExpired(@Param("now") LocalDateTime now);

}