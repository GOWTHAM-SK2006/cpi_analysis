package com.cpi.controller;

import com.cpi.dto.*;
import com.cpi.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public ResponseEntity<List<TeamResponse>> getAllTeams(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(teamService.getAllTeams(user.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTeam(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(teamService.getTeamById(id, user.getUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createTeam(@Valid @RequestBody TeamRequest request,
                                        @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(teamService.createTeam(request, user.getUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTeam(@PathVariable Long id,
                                        @Valid @RequestBody TeamRequest request,
                                        @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(teamService.updateTeam(id, request, user.getUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTeam(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        try {
            teamService.deleteTeam(id, user.getUsername());
            return ResponseEntity.ok(new ErrorResponse("Team deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    record ErrorResponse(String message) {}
}
