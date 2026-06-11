package com.cpi.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class PPIScoreRequest {
    @NotNull(message = "Player ID is required")
    private Long playerId;

    @NotNull @Min(1) @Max(10)
    private Integer trainingIntensity;

    @NotNull @Min(1) @Max(10)
    private Integer skillExecution;

    @NotNull @Min(1) @Max(10)
    private Integer focus;

    @NotNull @Min(1) @Max(10)
    private Integer coachability;

    @NotNull @Min(1) @Max(10)
    private Integer adaptability;
}
