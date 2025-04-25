package webapp_withauth.authapp.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import webapp_withauth.authapp.model.User;
import webapp_withauth.authapp.repository.UserRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class UserServiceTest {

    private UserRepository userRepository;
    private UserService userService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        userService = new UserService(userRepository);
    }

    // Load by valid username (enabled) → UserDetails
    @Test
    void loadUserByUsername_validUser_returnsUserDetails() {
        User user = User.builder()
                .username("validuser")
                .password("encodedpass")
                .role("USER")
                .enabled(true)
                .build();

        when(userRepository.findByUsername("validuser")).thenReturn(Optional.of(user));

        UserDetails result = userService.loadUserByUsername("validuser");

        assertEquals("validuser", result.getUsername());
        assertEquals("encodedpass", result.getPassword());
        assertTrue(result.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_USER")));
    }

    // Disabled user → UsernameNotFoundException
    @Test
    void loadUserByUsername_disabledUser_throwsUsernameNotFoundException() {
        User user = User.builder()
                .username("disableduser")
                .password("encodedpass")
                .role("USER")
                .enabled(false)
                .build();

        when(userRepository.findByUsername("disableduser")).thenReturn(Optional.of(user));

        assertThrows(UsernameNotFoundException.class, () -> userService.loadUserByUsername("disableduser"));
    }

    // User not found → UsernameNotFoundException
    @Test
    void loadUserByUsername_userNotFound_throwsUsernameNotFoundException() {
        when(userRepository.findByUsername("missinguser")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> userService.loadUserByUsername("missinguser"));
    }

    // User with blank/null role → IllegalStateException
    @Test
    void loadUserByUsername_missingRole_throwsIllegalStateException() {
        User user = User.builder()
                .username("noroleuser")
                .password("encodedpass")
                .role("")
                .enabled(true)
                .build();

        when(userRepository.findByUsername("noroleuser")).thenReturn(Optional.of(user));

        assertThrows(IllegalStateException.class, () -> userService.loadUserByUsername("noroleuser"));
    }
}