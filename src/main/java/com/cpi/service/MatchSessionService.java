package com.cpi.service;

import com.cpi.dto.*;
import com.cpi.entity.*;
import com.cpi.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MatchSessionService {

    private final MatchSessionRepository matchSessionRepository;
    private final TeamRepository teamRepository;
    private final CoachRepository coachRepository;

    public MatchSessionService(MatchSessionRepository matchSessionRepository,
                               TeamRepository teamRepository,
                               CoachRepository coachRepository) {
        this.matchSessionRepository = matchSessionRepository;
        this.teamRepository = teamRepository;
        this.coachRepository = coachRepository;
    }

    private Coach getCoach(String email) {
        return coachRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Coach not found"));
    }

    private MatchSessionResponse toResponse(MatchSession s) {
        return new MatchSessionResponse(s.getId(), s.getTeam().getId(),
                s.getTeam().getName(), s.getOpponent(), s.getDate(), s.getNotes());
    }

    public List<MatchSessionResponse> getAllSessions(String coachEmail) {
        Coach coach = getCoach(coachEmail);
        return matchSessionRepository.findByTeamCoachId(coach.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public MatchSessionResponse getSessionById(Long id, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        MatchSession session = matchSessionRepository.findByIdAndTeamCoachId(id, coach.getId())
                .orElseThrow(() -> new RuntimeException("Match session not found"));
        return toResponse(session);
    }

    public MatchSessionResponse createSession(MatchSessionRequest request, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        Team team = teamRepository.findByIdAndCoachId(request.getTeamId(), coach.getId())
                .orElseThrow(() -> new RuntimeException("Team not found"));

        MatchSession session = MatchSession.builder()
                .team(team)
                .opponent(request.getOpponent())
                .date(request.getDate())
                .notes(request.getNotes())
                .build();
        return toResponse(matchSessionRepository.save(session));
    }

    public void deleteSession(Long id, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        MatchSession session = matchSessionRepository.findByIdAndTeamCoachId(id, coach.getId())
                .orElseThrow(() -> new RuntimeException("Match session not found"));
        matchSessionRepository.delete(session);
    }
}
