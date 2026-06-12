package com.cpi.service;

import com.cpi.dto.*;
import com.cpi.entity.*;
import com.cpi.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PracticeSessionService {

    private final PracticeSessionRepository practiceSessionRepository;
    private final TeamRepository teamRepository;
    private final CoachRepository coachRepository;

    public PracticeSessionService(PracticeSessionRepository practiceSessionRepository,
                                  TeamRepository teamRepository,
                                  CoachRepository coachRepository) {
        this.practiceSessionRepository = practiceSessionRepository;
        this.teamRepository = teamRepository;
        this.coachRepository = coachRepository;
    }

    private Coach getCoach(String email) {
        return coachRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Coach not found"));
    }

    private PracticeSessionResponse toResponse(PracticeSession s) {
        return new PracticeSessionResponse(s.getId(), s.getTeam().getId(),
                s.getTeam().getName(), s.getDate(), s.getNotes());
    }

    public List<PracticeSessionResponse> getAllSessions(String coachEmail) {
        Coach coach = getCoach(coachEmail);
        return practiceSessionRepository.findByTeamCoachId(coach.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public PracticeSessionResponse getSessionById(Long id, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        PracticeSession session = practiceSessionRepository.findByIdAndTeamCoachId(id, coach.getId())
                .orElseThrow(() -> new RuntimeException("Practice session not found"));
        return toResponse(session);
    }

    public PracticeSessionResponse createSession(PracticeSessionRequest request, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        Team team = teamRepository.findByIdAndCoachId(request.getTeamId(), coach.getId())
                .orElseThrow(() -> new RuntimeException("Team not found"));

        PracticeSession session = PracticeSession.builder()
                .team(team)
                .date(request.getDate())
                .notes(request.getNotes())
                .build();
        return toResponse(practiceSessionRepository.save(session));
    }

    public void deleteSession(Long id, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        PracticeSession session = practiceSessionRepository.findByIdAndTeamCoachId(id, coach.getId())
                .orElseThrow(() -> new RuntimeException("Practice session not found"));
        practiceSessionRepository.delete(session);
    }
}
