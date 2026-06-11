package com.cpi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MPIScoreResponse {
    private Long id;
    private Long matchSessionId;
    private Long playerId;
    private String playerName;
    private Integer technicalExecution;
    private Integer decisionMaking;
    private Integer matchAwareness;
    private Integer mentalResilience;
    private Integer competitiveImpact;
    private Double mpi;
}
