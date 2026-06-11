package com.cpi.controller;

import com.cpi.dto.*;
import com.cpi.service.PPIScoreService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ppi")
public class PPIScoreController {

    private final PPIScoreService ppiScoreService;

    public PPIScoreController(PPIScoreService ppiScoreService) {
        this.ppiScoreService = ppiScoreService;
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<PPIScoreResponse>> getBySession(@PathVariable Long sessionId,
                                                                @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ppiScoreService.getScoresBySession(sessionId, user.getUsername()));
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<PPIScoreResponse>> getByPlayer(@PathVariable Long playerId,
                                                               @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ppiScoreService.getScoresByPlayer(playerId, user.getUsername()));
    }

    @PostMapping("/session/{sessionId}")
    public ResponseEntity<?> saveScore(@PathVariable Long sessionId,
                                       @Valid @RequestBody PPIScoreRequest request,
                                       @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ppiScoreService.saveScore(sessionId, request, user.getUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    record ErrorResponse(String message) {}
}
