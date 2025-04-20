package webapp_withauth.authapp.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import webapp_withauth.authapp.repository.PasswordResetTokenRepository;
import webapp_withauth.authapp.repository.PendingUserRepository;
import webapp_withauth.authapp.repository.RefreshTokenRepository;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class PendingUserCleanupJob {

    private final PendingUserRepository pendingUserRepo;
    private final PasswordResetTokenRepository resetTokenRepo;
    private final RefreshTokenRepository refreshTokenRepo;

    // Run every 10 minutes
    @Scheduled(fixedRate = 10 * 60 * 1000)
    public void cleanupExpiredPendingUsers() {
        LocalDateTime now = LocalDateTime.now();

        // Log count of expired users only, not all
        long count = pendingUserRepo.countExpired(now);
        pendingUserRepo.deleteExpired(now);

        if (count > 0) {
            log.info("🧹 Deleted {} expired pending user registrations", count);
        }
    }

    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void cleanExpiredResetTokens() {
        resetTokenRepo.deleteAllByExpiryBefore(LocalDateTime.now());
    }

    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void cleanExpiredRefreshTokens() {
        refreshTokenRepo.deleteAllByExpiryBefore(LocalDateTime.now());
    }
}