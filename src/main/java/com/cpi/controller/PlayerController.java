package com.cpi.controller;

import com.cpi.dto.*;
import com.cpi.service.PlayerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/players")
public class PlayerController {

    private final PlayerService playerService;

    public PlayerController(PlayerService playerService) {
        this.playerService = playerService;
    }

    @GetMapping
    public ResponseEntity<List<PlayerResponse>> getAllPlayers(
            @RequestParam(required = false) Long teamId,
            @AuthenticationPrincipal UserDetails user) {
        if (teamId != null) {
            return ResponseEntity.ok(playerService.getPlayersByTeam(teamId, user.getUsername()));
        }
        return ResponseEntity.ok(playerService.getAllPlayers(user.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPlayer(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(playerService.getPlayerById(id, user.getUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createPlayer(@Valid @RequestBody PlayerRequest request,
                                          @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(playerService.createPlayer(request, user.getUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePlayer(@PathVariable Long id,
                                          @Valid @RequestBody PlayerRequest request,
                                          @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(playerService.updatePlayer(id, request, user.getUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePlayer(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        try {
            playerService.deletePlayer(id, user.getUsername());
            return ResponseEntity.ok(new ErrorResponse("Player deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    record ErrorResponse(String message) {}
}
