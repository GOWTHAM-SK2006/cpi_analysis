package com.cpi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PPIScoreResponse {
    private Long id;
    private Long practiceSessionId;
    private Long playerId;
    private String playerName;
    private Integer trainingIntensity;
    private Integer skillExecution;
    private Integer focus;
    private Integer coachability;
    private Integer adaptability;
    private Double ppi;
}
