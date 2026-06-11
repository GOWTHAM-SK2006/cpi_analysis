package com.cpi.repository;

import com.cpi.entity.PracticeSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PracticeSessionRepository extends JpaRepository<PracticeSession, Long> {
    List<PracticeSession> findByTeamCoachId(Long coachId);
    List<PracticeSession> findByTeamIdAndTeamCoachId(Long teamId, Long coachId);
    Optional<PracticeSession> findByIdAndTeamCoachId(Long id, Long coachId);
}
