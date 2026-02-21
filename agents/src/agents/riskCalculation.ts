import { DeployGuardState } from "../state/deployGuardState";

export const riskCalculationAgent = async (
  state: DeployGuardState
): Promise<Partial<DeployGuardState>> => {
  const breakdown: Record<string, number> = {};

  // ── Diff Score (max 30) ──────────────────────────────
  const totalLines = state.lines_added + state.lines_deleted;
  let diffScore = 0;
  if (totalLines > 1000) diffScore = 30;
  else if (totalLines > 500) diffScore = 20;
  else if (totalLines > 200) diffScore = 10;
  else diffScore = 5;
  breakdown["diff"] = diffScore;

  // ── Dependency Score (max 25) ────────────────────────
  let depScore = 0;
  depScore += state.major_dependency_upgrades * 8;
  depScore += state.new_dependencies_count * 3;
  depScore += state.removed_dependencies_count * 2;
  depScore = Math.min(depScore, 25);
  breakdown["dependency"] = depScore;

  // ── Migration Score (max 20) ─────────────────────────
  const migrationScore = state.migration_files_detected ? 20 : 0;
  breakdown["migration"] = migrationScore;

  // ── Critical Path Score (max 25) ─────────────────────
  let criticalScore = 0;
  criticalScore += state.critical_files_touched.length * 5;
  criticalScore = Math.min(criticalScore, 25);
  breakdown["critical_paths"] = criticalScore;

  const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

  const riskLevel =
    totalScore >= 60 ? "HIGH" : totalScore >= 30 ? "MEDIUM" : "LOW";

  return {
    risk_score: totalScore,
    risk_level: riskLevel,
    risk_breakdown: breakdown
  };
};