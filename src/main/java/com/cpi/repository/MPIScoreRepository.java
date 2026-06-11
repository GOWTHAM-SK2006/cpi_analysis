package com.cpi.repository;

import com.cpi.entity.MPIScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MPIScoreRepository extends JpaRepository<MPIScore, Long> {
    List<MPIScore> findByMatchSessionId(Long matchSessionId);
    Optional<MPIScore> findByMatchSessionIdAndPlayerId(Long matchSessionId, Long playerId);
    List<MPIScore> findByPlayerId(Long playerId);

    @Query("SELECT AVG(m.mpi) FROM MPIScore m JOIN m.player pl JOIN pl.team t WHERE t.coach.id = :coachId")
    Double getAverageMPIByCoachId(@Param("coachId") Long coachId);
}
