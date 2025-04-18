package webapp_withauth.authapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AuthappApplication {
	public static void main(String[] args) {
		SpringApplication.run(AuthappApplication.class, args);
	}
}