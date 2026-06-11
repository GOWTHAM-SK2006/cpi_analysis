package com.cpi.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class MPIScoreRequest {
    @NotNull(message = "Player ID is required")
    private Long playerId;

    @NotNull @Min(1) @Max(10)
    private Integer technicalExecution;

    @NotNull @Min(1) @Max(10)
    private Integer decisionMaking;

    @NotNull @Min(1) @Max(10)
    private Integer matchAwareness;

    @NotNull @Min(1) @Max(10)
    private Integer mentalResilience;

    @NotNull @Min(1) @Max(10)
    private Integer competitiveImpact;
}
