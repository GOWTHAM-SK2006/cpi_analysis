package com.cpi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "match_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(nullable = false)
    private String opponent;

    @Column(nullable = false)
    private LocalDate date;

    private String notes;
}
