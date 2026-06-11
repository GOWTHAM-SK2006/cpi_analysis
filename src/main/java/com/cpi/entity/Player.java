package com.cpi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "players")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Player {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer age;

    @Column(nullable = false)
    private String role; // e.g. Batsman, Bowler, All-Rounder, Wicketkeeper

    @Column(nullable = false)
    private String battingStyle; // e.g. Right-hand bat, Left-hand bat

    @Column(nullable = false)
    private String bowlingStyle; // e.g. Right-arm fast, Off-break, None

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;
}
