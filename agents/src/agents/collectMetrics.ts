import { DeployGuardState } from "../state/deployGuardState";
import {
  getCheckRunsForSha,
  getLatestCommitOnBranch
} from "../tools/githubTools";

export const collectMetricsAgent = async (
  state: DeployGuardState
): Promise<Partial<DeployGuardState>> => {
  try {
    const { repo_owner, repo_name, pr_sha, base_branch, pat } = state;

    // Get check runs for the PR's latest commit
    const prCheckRuns = await getCheckRunsForSha(
      repo_owner, repo_name, pr_sha, pat
    );

    const checkRunsSummary: string[] = prCheckRuns.map(
      (run: any) => `${run.name}: ${run.conclusion || "in_progress"}`
    );

    // Get base branch latest commit and its check runs
    const baseSha = await getLatestCommitOnBranch(
      repo_owner, repo_name, base_branch, pat
    );

    const baseCheckRuns = await getCheckRunsForSha(
      repo_owner, repo_name, baseSha, pat
    );

    // Determine overall base branch build status
    const hasFailure = baseCheckRuns.some(
      (r: any) => r.conclusion === "failure"
    );
    const allSuccess = baseCheckRuns.every(
      (r: any) => r.conclusion === "success"
    );

    const baseBranchStatus = hasFailure
      ? "failure"
      : allSuccess
      ? "success"
      : "partial";

    return {
      check_runs_summary: checkRunsSummary,
      base_branch_last_build_status: baseBranchStatus
    };
  } catch (err: any) {
    return {
      errors: [...(state.errors || []), `CollectMetrics: ${err.message}`]
    };
  }
};