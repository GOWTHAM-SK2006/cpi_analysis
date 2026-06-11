package com.cpi.service;

import com.cpi.dto.*;
import com.cpi.entity.Coach;
import com.cpi.repository.CoachRepository;
import com.cpi.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final CoachRepository coachRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthService(CoachRepository coachRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils) {
        this.coachRepository = coachRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    public AuthResponse signup(SignupRequest request) {
        if (coachRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        Coach coach = Coach.builder()
                .name(request.getName())
                .academyName(request.getAcademyName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("COACH")
                .build();

        coachRepository.save(coach);

        String token = jwtUtils.generateToken(coach.getEmail());
        return new AuthResponse(token, coach.getName(), coach.getEmail(), coach.getAcademyName());
    }

    public AuthResponse login(LoginRequest request) {
        Coach coach = coachRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), coach.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtils.generateToken(coach.getEmail());
        return new AuthResponse(token, coach.getName(), coach.getEmail(), coach.getAcademyName());
    }
}
