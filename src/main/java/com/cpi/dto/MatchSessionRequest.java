package com.cpi.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Data
public class MatchSessionRequest {
    @NotNull(message = "Team ID is required")
    private Long teamId;

    @NotBlank(message = "Opponent name is required")
    private String opponent;

    @NotNull(message = "Date is required")
    private LocalDate date;

    private String notes;
}
