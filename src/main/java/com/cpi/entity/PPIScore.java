package com.cpi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ppi_scores", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"practice_session_id", "player_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PPIScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "practice_session_id", nullable = false)
    private PracticeSession practiceSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @Column(nullable = false)
    private Integer trainingIntensity; // 1-10

    @Column(nullable = false)
    private Integer skillExecution; // 1-10

    @Column(nullable = false)
    private Integer focus; // 1-10

    @Column(nullable = false)
    private Integer coachability; // 1-10

    @Column(nullable = false)
    private Integer adaptability; // 1-10

    @Column(nullable = false)
    private Double ppi; // Auto-calculated average (1-10)

    @PrePersist
    @PreUpdate
    public void calculatePPI() {
        this.ppi = (trainingIntensity + skillExecution + focus + coachability + adaptability) / 5.0;
    }
}
