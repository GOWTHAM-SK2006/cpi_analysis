package com.cpi.repository;

import com.cpi.entity.MatchSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MatchSessionRepository extends JpaRepository<MatchSession, Long> {
    List<MatchSession> findByTeamCoachId(Long coachId);
    List<MatchSession> findByTeamIdAndTeamCoachId(Long teamId, Long coachId);
    Optional<MatchSession> findByIdAndTeamCoachId(Long id, Long coachId);
}
