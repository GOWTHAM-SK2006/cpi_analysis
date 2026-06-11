package com.cpi.controller;

import com.cpi.dto.DashboardResponse;
import com.cpi.entity.Coach;
import com.cpi.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired private CoachRepository coachRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private PlayerRepository playerRepository;
    @Autowired private PPIScoreRepository ppiScoreRepository;
    @Autowired private MPIScoreRepository mpiScoreRepository;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(@AuthenticationPrincipal UserDetails user) {
        Coach coach = coachRepository.findByEmail(user.getUsername())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        long totalTeams = teamRepository.findByCoachId(coach.getId()).size();
        long totalPlayers = playerRepository.countByTeamCoachId(coach.getId());

        Double avgPpi = ppiScoreRepository.getAveragePPIByCoachId(coach.getId());
        Double avgMpi = mpiScoreRepository.getAverageMPIByCoachId(coach.getId());

        Double avgCpi = null;
        if (avgPpi != null && avgMpi != null) avgCpi = (avgPpi + avgMpi) / 2.0;
        else if (avgPpi != null) avgCpi = avgPpi;
        else if (avgMpi != null) avgCpi = avgMpi;

        return ResponseEntity.ok(new DashboardResponse(totalTeams, totalPlayers, avgCpi));
    }
}
