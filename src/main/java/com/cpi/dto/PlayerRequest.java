package com.cpi.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class PlayerRequest {
    @NotBlank(message = "Player name is required")
    private String name;

    @NotNull(message = "Age is required")
    @Min(value = 5, message = "Age must be at least 5")
    @Max(value = 60, message = "Age must be at most 60")
    private Integer age;

    @NotBlank(message = "Role is required")
    private String role;

    @NotBlank(message = "Batting style is required")
    private String battingStyle;

    @NotBlank(message = "Bowling style is required")
    private String bowlingStyle;

    @NotNull(message = "Team ID is required")
    private Long teamId;
}
