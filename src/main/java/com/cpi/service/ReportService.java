package com.cpi.service;

import com.cpi.dto.*;
import com.cpi.entity.*;
import com.cpi.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final PlayerRepository playerRepository;
    private final PPIScoreRepository ppiScoreRepository;
    private final MPIScoreRepository mpiScoreRepository;
    private final CoachRepository coachRepository;

    public ReportService(PlayerRepository playerRepository,
                         PPIScoreRepository ppiScoreRepository,
                         MPIScoreRepository mpiScoreRepository,
                         CoachRepository coachRepository) {
        this.playerRepository = playerRepository;
        this.ppiScoreRepository = ppiScoreRepository;
        this.mpiScoreRepository = mpiScoreRepository;
        this.coachRepository = coachRepository;
    }

    private Coach getCoach(String email) {
        return coachRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Coach not found"));
    }

    public PlayerDetailResponse getPlayerDetail(Long playerId, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        Player player = playerRepository.findByIdAndTeamCoachId(playerId, coach.getId())
                .orElseThrow(() -> new RuntimeException("Player not found"));

        List<PPIScoreResponse> ppiHistory = ppiScoreRepository.findByPlayerId(playerId)
                .stream().map(s -> new PPIScoreResponse(s.getId(), s.getPracticeSession().getId(),
                        s.getPlayer().getId(), s.getPlayer().getName(),
                        s.getTrainingIntensity(), s.getSkillExecution(), s.getFocus(),
                        s.getCoachability(), s.getAdaptability(), s.getPpi()))
                .collect(Collectors.toList());

        List<MPIScoreResponse> mpiHistory = mpiScoreRepository.findByPlayerId(playerId)
                .stream().map(s -> new MPIScoreResponse(s.getId(), s.getMatchSession().getId(),
                        s.getPlayer().getId(), s.getPlayer().getName(),
                        s.getTechnicalExecution(), s.getDecisionMaking(), s.getMatchAwareness(),
                        s.getMentalResilience(), s.getCompetitiveImpact(), s.getMpi()))
                .collect(Collectors.toList());

        Double avgPpi = ppiHistory.isEmpty() ? null :
                ppiHistory.stream().mapToDouble(PPIScoreResponse::getPpi).average().orElse(0);
        Double avgMpi = mpiHistory.isEmpty() ? null :
                mpiHistory.stream().mapToDouble(MPIScoreResponse::getMpi).average().orElse(0);
        Double cpi = (avgPpi != null && avgMpi != null) ? (avgPpi + avgMpi) / 2.0
                : avgPpi != null ? avgPpi : avgMpi;

        PlayerDetailResponse res = new PlayerDetailResponse();
        res.setId(player.getId()); res.setName(player.getName());
        res.setAge(player.getAge()); res.setRole(player.getRole());
        res.setBattingStyle(player.getBattingStyle()); res.setBowlingStyle(player.getBowlingStyle());
        res.setTeamName(player.getTeam().getName());
        res.setAveragePpi(avgPpi); res.setAverageMpi(avgMpi); res.setCpi(cpi);
        res.setPpiHistory(ppiHistory); res.setMpiHistory(mpiHistory);
        return res;
    }

    public List<PlayerDetailResponse> getTeamReport(Long teamId, String coachEmail) {
        Coach coach = getCoach(coachEmail);
        return playerRepository.findByTeamIdAndTeamCoachId(teamId, coach.getId())
                .stream().map(p -> getPlayerDetail(p.getId(), coachEmail))
                .collect(Collectors.toList());
    }
}
