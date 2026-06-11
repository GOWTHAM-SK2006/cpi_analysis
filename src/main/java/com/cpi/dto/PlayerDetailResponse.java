package com.cpi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlayerDetailResponse {
    private Long id;
    private String name;
    private Integer age;
    private String role;
    private String battingStyle;
    private String bowlingStyle;
    private String teamName;
    private Double averagePpi;
    private Double averageMpi;
    private Double cpi;
    private List<PPIScoreResponse> ppiHistory;
    private List<MPIScoreResponse> mpiHistory;
}
