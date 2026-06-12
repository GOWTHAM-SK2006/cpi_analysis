/**
 * content-architecture.js
 * Configurable future content sections for the CPI Platform.
 * Organizing Expert Coaching Content, Score Interpretations, Practice Plans, and Development Recommendations.
 */

export const FutureContentConfig = {
  // 1. Score Interpretation Framework
  interpretations: {
    elite: {
      minScore: 7.5,
      title: "Elite Performance (Score: 7.5 - 10.0)",
      text: "[Content To Be Added: Expert sports science interpretation detailing optimal physical conditioning, neuro-muscular efficiency, and match-scenario mastery associated with high scoring levels.]",
      developmentFocus: "Optimize performance consistency, advanced psychological resilience, and team leadership traits."
    },
    competent: {
      minScore: 5.0,
      title: "Competent Performance (Score: 5.0 - 7.4)",
      text: "[Content To Be Added: Detailed coaching analysis for athlete transition from mechanical skill execution to tactical game awareness. Focus on high-pressure decision-making adjustments.]",
      developmentFocus: "Refining technique under pressure, physical endurance pacing, and situational adaptability."
    },
    developing: {
      minScore: 0.0,
      title: "Developing Performance (Score: 0.0 - 4.9)",
      text: "[Content To Be Added: Fundamental sports pedagogy analysis highlighting foundational biomechanics, motor control stability, and core tactical comprehension.]",
      developmentFocus: "Core technical mastery, athletic conditioning foundations, and feedback receptivity."
    }
  },

  // 2. Coaching Recommendations Framework
  coachingRecommendations: {
    batsman: {
      title: "Batsman Development Advice",
      recommendations: [
        "[Content To Be Added: Specific biomechanical adjustment instructions for weight transfer and bat-swing path alignment.]",
        "[Content To Be Added: Specialized shot-selection heuristics depending on varying pitch bounce and bowler release height.]",
        "[Content To Be Added: Mental imagery drills to enhance visual trigger identification and pre-delivery focus.]"
      ]
    },
    bowler: {
      title: "Bowler Development Advice",
      recommendations: [
        "[Content To Be Added: Expert stride-alignment coaching points to prevent energy leaks and optimize release velocity.]",
        "[Content To Be Added: Tactical guidance on setting field lines matching line-and-length strategies.]",
        "[Content To Be Added: Micro-adjustments for finger/wrist positioning to influence seam angle stability.]"
      ]
    },
    allRounder: {
      title: "All-Rounder Balance Advice",
      recommendations: [
        "[Content To Be Added: Recovery load management schedules to prevent overuse injury while maintaining both skills.]",
        "[Content To Be Added: Game-scenario strategies focusing on role transition efficiency from primary to secondary discipline.]",
        "[Content To Be Added: High-pressure decision-making scenarios combining pressure batting and death overs bowling.]"
      ]
    },
    wicketkeeper: {
      title: "Wicketkeeper Specialization Advice",
      recommendations: [
        "[Content To Be Added: Plyometrics routine guidelines to enhance lateral footwork agility and glove-reach extension.]",
        "[Content To Be Added: Techniques for maintaining posture stability and focus through extended multi-session spells.]",
        "[Content To Be Added: Leadership communication scripts for orchestrating inner-ring field placements.]"
      ]
    },
    general: {
      title: "General Coaching Guidance",
      recommendations: [
        "[Content To Be Added: Athlete communication protocols to enhance feedback loop efficiency between sessions.]",
        "[Content To Be Added: Team-building exercises to elevate team cohesion index (TPI) and match synergy.]",
        "[Content To Be Added: Video analysis protocols to self-audit movement mechanics and tactical execution.]"
      ]
    }
  },

  // 3. Practice Recommendations Framework
  practiceRecommendations: {
    intensity: {
      title: "High-Intensity & Conditioning Workout Plans",
      suggestedPlans: [
        "[Content To Be Added: Speed endurance shuttle runs integrated with skill drills to simulate late-innings fatigue.]",
        "[Content To Be Added: Interval training schedules targeting cardiovascular stamina recovery between overs.]"
      ]
    },
    execution: {
      title: "Skill Execution & Precision Plans",
      suggestedPlans: [
        "[Content To Be Added: Closed-loop technical drill routines emphasizing repeating identical mechanics under controlled environments.]",
        "[Content To Be Added: Targeted target-hitting challenges with incremental boundary limitations.]"
      ]
    },
    focus: {
      title: "Mental Focus & Concentration Plans",
      suggestedPlans: [
        "[Content To Be Added: Stress-induction net sessions incorporating simulated distractions and auditory noise.]",
        "[Content To Be Added: Mindfulness breathing intervals between bowling spells or batting overs.]"
      ]
    },
    coachability: {
      title: "Cooperative Learning & Tactical Plans",
      suggestedPlans: [
        "[Content To Be Added: Interactive review logs comparing player self-scores with coach-assessed indices.]",
        "[Content To Be Added: Peer mentoring tasks where senior players audit technique execution of juniors.]"
      ]
    },
    adaptability: {
      title: "Situational Adaptability & Match Play Plans",
      suggestedPlans: [
        "[Content To Be Added: Variable-condition training parameters like changing ball weight, pitch length, or field restrictions mid-session.]",
        "[Content To Be Added: Scenario-based cricket games requiring immediate strategy shifts based on runs required.]"
      ]
    },
    default: {
      title: "Universal Development Plan",
      suggestedPlans: [
        "[Content To Be Added: Dynamic warm-up regimens combined with fundamental catching/throwing drills.]",
        "[Content To Be Added: Weekly performance self-evaluation checklists logging physical readiness and mood indices.]"
      ]
    }
  },

  // 4. Helper helper to resolve the appropriate content for a given player report dynamically
  getInterpretation(cpi) {
    if (cpi >= this.interpretations.elite.minScore) return this.interpretations.elite;
    if (cpi >= this.interpretations.competent.minScore) return this.interpretations.competent;
    return this.interpretations.developing;
  },

  getCoachingAdvice(role) {
    const key = (role || '').toLowerCase().replace('-', '');
    if (key.includes('batsman') || key.includes('batting')) return this.coachingRecommendations.batsman;
    if (key.includes('bowler') || key.includes('bowling')) return this.coachingRecommendations.bowler;
    if (key.includes('rounder')) return this.coachingRecommendations.allRounder;
    if (key.includes('keeper')) return this.coachingRecommendations.wicketkeeper;
    return this.coachingRecommendations.general;
  },

  getPracticePlan(weakestPillar) {
    const key = (weakestPillar || '').toLowerCase();
    if (key.includes('intensity')) return this.practiceRecommendations.intensity;
    if (key.includes('execution')) return this.practiceRecommendations.execution;
    if (key.includes('focus')) return this.practiceRecommendations.focus;
    if (key.includes('coachability')) return this.practiceRecommendations.coachability;
    if (key.includes('adaptability')) return this.practiceRecommendations.adaptability;
    return this.practiceRecommendations.default;
  }
};
