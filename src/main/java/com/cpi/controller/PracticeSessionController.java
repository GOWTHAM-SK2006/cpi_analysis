package com.cpi.controller;

import com.cpi.dto.*;
import com.cpi.service.PracticeSessionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/practice-sessions")
public class PracticeSessionController {

    @Autowired
    private PracticeSessionService practiceSessionService;

    @GetMapping
    public ResponseEntity<List<PracticeSessionResponse>> getAll(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(practiceSessionService.getAllSessions(user.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(practiceSessionService.getSessionById(id, user.getUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody PracticeSessionRequest request,
                                    @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(practiceSessionService.createSession(request, user.getUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        try {
            practiceSessionService.deleteSession(id, user.getUsername());
            return ResponseEntity.ok(new ErrorResponse("Session deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    record ErrorResponse(String message) {}
}
