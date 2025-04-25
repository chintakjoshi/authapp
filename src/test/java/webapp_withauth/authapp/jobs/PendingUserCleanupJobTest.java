package webapp_withauth.authapp.jobs;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import webapp_withauth.authapp.repository.PasswordResetTokenRepository;
import webapp_withauth.authapp.repository.PendingUserRepository;
import webapp_withauth.authapp.repository.RefreshTokenRepository;

import java.time.LocalDateTime;

import static org.mockito.Mockito.*;

public class PendingUserCleanupJobTest {

    private PendingUserRepository pendingUserRepo;
    private PasswordResetTokenRepository resetTokenRepo;
    private RefreshTokenRepository refreshTokenRepo;
    private PendingUserCleanupJob cleanupJob;

    @BeforeEach
    void setup() {
        pendingUserRepo = mock(PendingUserRepository.class);
        resetTokenRepo = mock(PasswordResetTokenRepository.class);
        refreshTokenRepo = mock(RefreshTokenRepository.class);
        cleanupJob = new PendingUserCleanupJob(pendingUserRepo, resetTokenRepo, refreshTokenRepo);
    }

    // Manually invoke job methods without error
    @Test
    void manuallyInvokingAllJobMethods_runsWithoutException() {
        when(pendingUserRepo.countExpired(any())).thenReturn(0L);

        cleanupJob.cleanupExpiredPendingUsers();
        cleanupJob.cleanExpiredResetTokens();
        cleanupJob.cleanExpiredRefreshTokens();
    }

    // Cleanup expired pending users
    @Test
    void expiredPendingUsers_areDeletedIfPresent() {
        when(pendingUserRepo.countExpired(any())).thenReturn(3L);

        cleanupJob.cleanupExpiredPendingUsers();

        verify(pendingUserRepo).countExpired(any());
        verify(pendingUserRepo).deleteExpired(any());
    }

    // Expired reset and refresh tokens are cleaned
    @Test
    void expiredTokens_areDeleted() {
        cleanupJob.cleanExpiredResetTokens();
        cleanupJob.cleanExpiredRefreshTokens();

        verify(resetTokenRepo).deleteAllByExpiryBefore(any(LocalDateTime.class));
        verify(refreshTokenRepo).deleteAllByExpiryBefore(any(LocalDateTime.class));
    }
}