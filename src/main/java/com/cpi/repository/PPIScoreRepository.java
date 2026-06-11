package com.cpi.repository;

import com.cpi.entity.PPIScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PPIScoreRepository extends JpaRepository<PPIScore, Long> {
    List<PPIScore> findByPracticeSessionId(Long practiceSessionId);
    Optional<PPIScore> findByPracticeSessionIdAndPlayerId(Long practiceSessionId, Long playerId);
    List<PPIScore> findByPlayerId(Long playerId);
    
    @Query("SELECT AVG(p.ppi) FROM PPIScore p JOIN p.player pl JOIN pl.team t WHERE t.coach.id = :coachId")
    Double getAveragePPIByCoachId(@Param("coachId") Long coachId);
}
