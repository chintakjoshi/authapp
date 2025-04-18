package webapp_withauth.authapp.service;

import webapp_withauth.authapp.model.User;
import webapp_withauth.authapp.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository repo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = repo.findByUsername(username)
                .filter(User::isEnabled)
                .orElseThrow(() -> new UsernameNotFoundException("User not found or not verified"));

        System.out.println("🔍 Found user: " + user.getUsername());
        System.out.println("   Role: " + user.getRole());
        System.out.println("   Password: " + user.getPassword());

        if (user.getRole() == null || user.getRole().isBlank()) {
            throw new IllegalStateException("User role is missing for: " + username);
        }

        try {
            return org.springframework.security.core.userdetails.User.builder()
                    .username(user.getUsername())
                    .password(user.getPassword())
                    .roles(user.getRole())
                    .build();
        } catch (Exception e) {
            System.out.println("💥 Failed to build UserDetails:");
            System.out.println("   username: " + user.getUsername());
            System.out.println("   password: " + user.getPassword());
            System.out.println("   role:     " + user.getRole());
            e.printStackTrace();
            throw e;
        }
    }
}