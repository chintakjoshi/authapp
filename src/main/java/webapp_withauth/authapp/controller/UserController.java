package webapp_withauth.authapp.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api")
public class UserController {

    @GetMapping("/secure-endpoint")
    public ResponseEntity<String> secure() {
        return ResponseEntity.ok("Hello from a protected endpoint!");
    }
}