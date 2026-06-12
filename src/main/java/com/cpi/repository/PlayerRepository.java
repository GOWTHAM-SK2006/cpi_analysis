package com.cpi.repository;

import com.cpi.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {

    @Query("SELECT p FROM Player p JOIN FETCH p.team t WHERE t.coach.id = :coachId")
    List<Player> findByTeamCoachId(@Param("coachId") Long coachId);

    @Query("SELECT p FROM Player p JOIN FETCH p.team t WHERE t.id = :teamId AND t.coach.id = :coachId")
    List<Player> findByTeamIdAndTeamCoachId(@Param("teamId") Long teamId, @Param("coachId") Long coachId);

    @Query("SELECT p FROM Player p JOIN FETCH p.team t WHERE p.id = :id AND t.coach.id = :coachId")
    Optional<Player> findByIdAndTeamCoachId(@Param("id") Long id, @Param("coachId") Long coachId);

    long countByTeamCoachId(Long coachId);
}
