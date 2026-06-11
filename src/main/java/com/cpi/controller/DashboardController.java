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

    private final CoachRepository coachRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final PPIScoreRepository ppiScoreRepository;
    private final MPIScoreRepository mpiScoreRepository;
    private final PracticeSessionRepository practiceSessionRepository;
    private final MatchSessionRepository matchSessionRepository;

    public DashboardController(CoachRepository coachRepository,
                               TeamRepository teamRepository,
                               PlayerRepository playerRepository,
                               PPIScoreRepository ppiScoreRepository,
                               MPIScoreRepository mpiScoreRepository,
                               PracticeSessionRepository practiceSessionRepository,
                               MatchSessionRepository matchSessionRepository) {
        this.coachRepository = coachRepository;
        this.teamRepository = teamRepository;
        this.playerRepository = playerRepository;
        this.ppiScoreRepository = ppiScoreRepository;
        this.mpiScoreRepository = mpiScoreRepository;
        this.practiceSessionRepository = practiceSessionRepository;
        this.matchSessionRepository = matchSessionRepository;
    }

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

        long totalPractice = practiceSessionRepository.findByTeamCoachId(coach.getId()).size();
        long totalMatches = matchSessionRepository.findByTeamCoachId(coach.getId()).size();
        long totalSessions = totalPractice + totalMatches;

        return ResponseEntity.ok(new DashboardResponse(totalTeams, totalPlayers, avgCpi, totalSessions));
    }
}
