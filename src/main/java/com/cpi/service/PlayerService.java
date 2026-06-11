package com.cpi.service;

import com.cpi.dto.*;
import com.cpi.entity.*;
import com.cpi.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;
    private final CoachRepository coachRepository;

    public PlayerService(PlayerRepository playerRepository,
                         TeamRepository teamRepository,
                         CoachRepository coachRepository) {
        this.playerRepository = playerRepository;
        this.teamRepository = teamRepository;
        this.coachRepository = coachRepository;
    }

    private Coach getCoach(String email) {
        return coachRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Coach not found"));
    }

    private PlayerResponse toResponse(Player p) {
        return new PlayerResponse(p.getId(), p.getName(), p.getAge(), p.getRole(),
                p.getBattingStyle(), p.getBowlingStyle(), p.getTeam().getId(), p.getTeam().getName());
    }

    public List<PlayerResponse> getAllPlayers(String coachEmail) {
        Coach coach = getCoach(coachEmail);
        return playerRepository.findByTeamCoachId(coach.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<PlayerResponse> getPlayersByTeam(Long teamId, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        return playerRepository.findByTeamIdAndTeamCoachId(teamId, coach.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public PlayerResponse getPlayerById(Long id, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        Player player = playerRepository.findByIdAndTeamCoachId(id, coach.getId())
                .orElseThrow(() -> new RuntimeException("Player not found"));
        return toResponse(player);
    }

    public PlayerResponse createPlayer(PlayerRequest request, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        Team team = teamRepository.findByIdAndCoachId(request.getTeamId(), coach.getId())
                .orElseThrow(() -> new RuntimeException("Team not found"));

        Player player = Player.builder()
                .name(request.getName())
                .age(request.getAge())
                .role(request.getRole())
                .battingStyle(request.getBattingStyle())
                .bowlingStyle(request.getBowlingStyle())
                .team(team)
                .build();
        return toResponse(playerRepository.save(player));
    }

    public PlayerResponse updatePlayer(Long id, PlayerRequest request, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        Player player = playerRepository.findByIdAndTeamCoachId(id, coach.getId())
                .orElseThrow(() -> new RuntimeException("Player not found"));
        Team team = teamRepository.findByIdAndCoachId(request.getTeamId(), coach.getId())
                .orElseThrow(() -> new RuntimeException("Team not found"));

        player.setName(request.getName());
        player.setAge(request.getAge());
        player.setRole(request.getRole());
        player.setBattingStyle(request.getBattingStyle());
        player.setBowlingStyle(request.getBowlingStyle());
        player.setTeam(team);
        return toResponse(playerRepository.save(player));
    }

    public void deletePlayer(Long id, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        Player player = playerRepository.findByIdAndTeamCoachId(id, coach.getId())
                .orElseThrow(() -> new RuntimeException("Player not found"));
        playerRepository.delete(player);
    }
}
