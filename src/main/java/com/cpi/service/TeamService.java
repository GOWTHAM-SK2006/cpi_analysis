package com.cpi.service;

import com.cpi.dto.*;
import com.cpi.entity.*;
import com.cpi.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private CoachRepository coachRepository;

    private Coach getCoach(String email) {
        return coachRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Coach not found"));
    }

    private TeamResponse toResponse(Team team) {
        return new TeamResponse(team.getId(), team.getName(), team.getDescription(), team.getCoach().getId());
    }

    public List<TeamResponse> getAllTeams(String coachEmail) {
        Coach coach = getCoach(coachEmail);
        return teamRepository.findByCoachId(coach.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public TeamResponse getTeamById(Long id, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        Team team = teamRepository.findByIdAndCoachId(id, coach.getId())
                .orElseThrow(() -> new RuntimeException("Team not found"));
        return toResponse(team);
    }

    public TeamResponse createTeam(TeamRequest request, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        Team team = Team.builder()
                .name(request.getName())
                .description(request.getDescription())
                .coach(coach)
                .build();
        return toResponse(teamRepository.save(team));
    }

    public TeamResponse updateTeam(Long id, TeamRequest request, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        Team team = teamRepository.findByIdAndCoachId(id, coach.getId())
                .orElseThrow(() -> new RuntimeException("Team not found"));
        team.setName(request.getName());
        team.setDescription(request.getDescription());
        return toResponse(teamRepository.save(team));
    }

    public void deleteTeam(Long id, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        Team team = teamRepository.findByIdAndCoachId(id, coach.getId())
                .orElseThrow(() -> new RuntimeException("Team not found"));
        teamRepository.delete(team);
    }
}
