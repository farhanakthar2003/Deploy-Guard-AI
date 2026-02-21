import { buildDeployGuardGraph } from "./graph";
import { DeployGuardState } from "./state/deployGuardState";

export const runDeployGuardPipeline = async (context: {
  repo_owner: string;
  repo_name: string;
  repo_id: string;
  pr_number: number;
  pr_sha: string;
  base_branch: string;
  head_branch: string;
  pr_title: string;
  pr_description: string | null;
  author: string;
  pat: string;
}) => {
  console.log(`Starting DeployGuard pipeline for PR #${context.pr_number}`);

  const initialState: DeployGuardState = {
    ...context,
    lines_added: 0,
    lines_deleted: 0,
    total_files_changed: 0,
    changed_files: [],
    critical_files_touched: [],
    migration_files_detected: false,
    check_runs_summary: [],
    base_branch_last_build_status: null,
    major_dependency_upgrades: 0,
    new_dependencies_count: 0,
    removed_dependencies_count: 0,
    risk_score: 0,
    risk_level: "LOW",
    risk_breakdown: {},
    strategy_summary: "",
    strategy_reasoning: "",
    deployment_plan: [],
    pre_ci_checks_to_add: [],
    rollback_preparation: [],
    strategy_confidence: 0,
    formatted_comment: "",
    errors: []
  };

  const graph = buildDeployGuardGraph();
  const result = await graph.invoke(initialState);

  if (result.errors?.length > 0) {
    console.error("Pipeline completed with errors:", result.errors);
  } else {
    console.log(`Pipeline complete. Risk: ${result.risk_level} (${result.risk_score})`);
  }

  return result;
};

// If run directly as a subprocess by the backend
if (require.main === module) {
  const context = JSON.parse(process.env.DEPLOY_GUARD_CONTEXT || "{}");
  runDeployGuardPipeline(context)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Pipeline failed:", err);
      process.exit(1);
    });
}