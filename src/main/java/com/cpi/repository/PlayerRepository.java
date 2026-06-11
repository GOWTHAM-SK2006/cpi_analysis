package com.cpi.repository;

import com.cpi.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByTeamCoachId(Long coachId);
    List<Player> findByTeamIdAndTeamCoachId(Long teamId, Long coachId);
    Optional<Player> findByIdAndTeamCoachId(Long id, Long coachId);
    long countByTeamCoachId(Long coachId);
}
