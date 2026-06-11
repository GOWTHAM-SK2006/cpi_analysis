package com.cpi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlayerResponse {
    private Long id;
    private String name;
    private Integer age;
    private String role;
    private String battingStyle;
    private String bowlingStyle;
    private Long teamId;
    private String teamName;
}
