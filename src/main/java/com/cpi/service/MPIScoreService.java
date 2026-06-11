package com.cpi.service;

import com.cpi.dto.*;
import com.cpi.entity.*;
import com.cpi.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MPIScoreService {

    @Autowired
    private MPIScoreRepository mpiScoreRepository;

    @Autowired
    private MatchSessionRepository matchSessionRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private CoachRepository coachRepository;

    private Coach getCoach(String email) {
        return coachRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Coach not found"));
    }

    private MPIScoreResponse toResponse(MPIScore s) {
        return new MPIScoreResponse(s.getId(), s.getMatchSession().getId(),
                s.getPlayer().getId(), s.getPlayer().getName(),
                s.getTechnicalExecution(), s.getDecisionMaking(), s.getMatchAwareness(),
                s.getMentalResilience(), s.getCompetitiveImpact(), s.getMpi());
    }

    public List<MPIScoreResponse> getScoresBySession(Long sessionId, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        matchSessionRepository.findByIdAndTeamCoachId(sessionId, coach.getId())
                .orElseThrow(() -> new RuntimeException("Match session not found"));
        return mpiScoreRepository.findByMatchSessionId(sessionId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<MPIScoreResponse> getScoresByPlayer(Long playerId, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        playerRepository.findByIdAndTeamCoachId(playerId, coach.getId())
                .orElseThrow(() -> new RuntimeException("Player not found"));
        return mpiScoreRepository.findByPlayerId(playerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public MPIScoreResponse saveScore(Long sessionId, MPIScoreRequest request, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        MatchSession session = matchSessionRepository.findByIdAndTeamCoachId(sessionId, coach.getId())
                .orElseThrow(() -> new RuntimeException("Match session not found"));
        Player player = playerRepository.findByIdAndTeamCoachId(request.getPlayerId(), coach.getId())
                .orElseThrow(() -> new RuntimeException("Player not found"));

        MPIScore score = mpiScoreRepository.findByMatchSessionIdAndPlayerId(sessionId, player.getId())
                .orElse(MPIScore.builder().matchSession(session).player(player).build());

        score.setTechnicalExecution(request.getTechnicalExecution());
        score.setDecisionMaking(request.getDecisionMaking());
        score.setMatchAwareness(request.getMatchAwareness());
        score.setMentalResilience(request.getMentalResilience());
        score.setCompetitiveImpact(request.getCompetitiveImpact());

        return toResponse(mpiScoreRepository.save(score));
    }
}
