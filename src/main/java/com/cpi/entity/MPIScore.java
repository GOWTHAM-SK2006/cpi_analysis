package com.cpi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "mpi_scores", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"match_session_id", "player_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MPIScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_session_id", nullable = false)
    private MatchSession matchSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @Column(nullable = false)
    private Integer technicalExecution; // 1-10

    @Column(nullable = false)
    private Integer decisionMaking; // 1-10

    @Column(nullable = false)
    private Integer matchAwareness; // 1-10

    @Column(nullable = false)
    private Integer mentalResilience; // 1-10

    @Column(nullable = false)
    private Integer competitiveImpact; // 1-10

    @Column(nullable = false)
    private Double mpi; // Auto-calculated average (1-10)

    @PrePersist
    @PreUpdate
    public void calculateMPI() {
        this.mpi = (technicalExecution + decisionMaking + matchAwareness + mentalResilience + competitiveImpact) / 5.0;
    }
}
