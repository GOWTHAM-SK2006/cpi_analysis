package com.cpi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MatchSessionResponse {
    private Long id;
    private Long teamId;
    private String teamName;
    private String opponent;
    private LocalDate date;
    private String notes;
}
