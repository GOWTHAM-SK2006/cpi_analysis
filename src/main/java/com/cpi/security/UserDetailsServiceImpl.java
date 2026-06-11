package com.cpi.security;

import com.cpi.entity.Coach;
import com.cpi.repository.CoachRepository;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final CoachRepository coachRepository;

    public UserDetailsServiceImpl(CoachRepository coachRepository) {
        this.coachRepository = coachRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Coach coach = coachRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Coach not found with email: " + email));

        return new org.springframework.security.core.userdetails.User(
                coach.getEmail(),
                coach.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + coach.getRole()))
        );
    }
}
