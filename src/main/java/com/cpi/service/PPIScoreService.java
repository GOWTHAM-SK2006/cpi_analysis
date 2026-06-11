package com.cpi.service;

import com.cpi.dto.*;
import com.cpi.entity.*;
import com.cpi.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PPIScoreService {

    private final PPIScoreRepository ppiScoreRepository;
    private final PracticeSessionRepository practiceSessionRepository;
    private final PlayerRepository playerRepository;
    private final CoachRepository coachRepository;

    public PPIScoreService(PPIScoreRepository ppiScoreRepository,
                           PracticeSessionRepository practiceSessionRepository,
                           PlayerRepository playerRepository,
                           CoachRepository coachRepository) {
        this.ppiScoreRepository = ppiScoreRepository;
        this.practiceSessionRepository = practiceSessionRepository;
        this.playerRepository = playerRepository;
        this.coachRepository = coachRepository;
    }

    private Coach getCoach(String email) {
        return coachRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Coach not found"));
    }

    private PPIScoreResponse toResponse(PPIScore s) {
        return new PPIScoreResponse(s.getId(), s.getPracticeSession().getId(),
                s.getPlayer().getId(), s.getPlayer().getName(),
                s.getTrainingIntensity(), s.getSkillExecution(), s.getFocus(),
                s.getCoachability(), s.getAdaptability(), s.getPpi());
    }

    public List<PPIScoreResponse> getScoresBySession(Long sessionId, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        practiceSessionRepository.findByIdAndTeamCoachId(sessionId, coach.getId())
                .orElseThrow(() -> new RuntimeException("Practice session not found"));
        return ppiScoreRepository.findByPracticeSessionId(sessionId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<PPIScoreResponse> getScoresByPlayer(Long playerId, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        playerRepository.findByIdAndTeamCoachId(playerId, coach.getId())
                .orElseThrow(() -> new RuntimeException("Player not found"));
        return ppiScoreRepository.findByPlayerId(playerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public PPIScoreResponse saveScore(Long sessionId, PPIScoreRequest request, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        PracticeSession session = practiceSessionRepository.findByIdAndTeamCoachId(sessionId, coach.getId())
                .orElseThrow(() -> new RuntimeException("Practice session not found"));
        Player player = playerRepository.findByIdAndTeamCoachId(request.getPlayerId(), coach.getId())
                .orElseThrow(() -> new RuntimeException("Player not found"));

        // If score already exists for this player in this session, update it
        PPIScore score = ppiScoreRepository.findByPracticeSessionIdAndPlayerId(sessionId, player.getId())
                .orElse(PPIScore.builder().practiceSession(session).player(player).build());

        score.setTrainingIntensity(request.getTrainingIntensity());
        score.setSkillExecution(request.getSkillExecution());
        score.setFocus(request.getFocus());
        score.setCoachability(request.getCoachability());
        score.setAdaptability(request.getAdaptability());

        return toResponse(ppiScoreRepository.save(score));
    }
}
