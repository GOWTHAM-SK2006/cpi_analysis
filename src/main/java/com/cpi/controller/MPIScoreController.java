package com.cpi.controller;

import com.cpi.dto.*;
import com.cpi.service.MPIScoreService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mpi")
public class MPIScoreController {

    @Autowired
    private MPIScoreService mpiScoreService;

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<MPIScoreResponse>> getBySession(@PathVariable Long sessionId,
                                                                @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(mpiScoreService.getScoresBySession(sessionId, user.getUsername()));
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<MPIScoreResponse>> getByPlayer(@PathVariable Long playerId,
                                                               @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(mpiScoreService.getScoresByPlayer(playerId, user.getUsername()));
    }

    @PostMapping("/session/{sessionId}")
    public ResponseEntity<?> saveScore(@PathVariable Long sessionId,
                                       @Valid @RequestBody MPIScoreRequest request,
                                       @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(mpiScoreService.saveScore(sessionId, request, user.getUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    record ErrorResponse(String message) {}
}
