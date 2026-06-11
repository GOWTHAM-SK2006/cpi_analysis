package com.cpi.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class TeamRequest {
    @NotBlank(message = "Team name is required")
    private String name;

    private String description;
}
