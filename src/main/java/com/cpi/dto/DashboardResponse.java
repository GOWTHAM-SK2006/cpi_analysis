package com.cpi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardResponse {
    private long totalTeams;
    private long totalPlayers;
    private Double averageCpi; // (avgPPI + avgMPI) / 2
    private long totalSessions;
}
