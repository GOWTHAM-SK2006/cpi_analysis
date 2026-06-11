package com.cpi.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Data
public class PracticeSessionRequest {
    @NotNull(message = "Team ID is required")
    private Long teamId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    private String notes;
}
