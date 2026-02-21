export interface DeployGuardState {
  // PR identity
  repo_owner: string;
  repo_name: string;
  repo_id: string;
  pr_number: number;
  pr_sha: string;
  base_branch: string;
  head_branch: string;
  pat: string;

  // PR metadata
  pr_title: string;
  pr_description: string | null;
  author: string;

  // Diff signals
  lines_added: number;
  lines_deleted: number;
  total_files_changed: number;
  changed_files: string[];
  critical_files_touched: string[];
  migration_files_detected: boolean;

  // Metrics signals
  check_runs_summary: string[];
  base_branch_last_build_status: string | null;

  // Dependency signals
  major_dependency_upgrades: number;
  new_dependencies_count: number;
  removed_dependencies_count: number;

  // Risk results
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  risk_breakdown: Record<string, number>;

  // Strategy
  strategy_summary: string;
  strategy_reasoning: string;
  deployment_plan: string[];
  pre_ci_checks_to_add: string[];
  rollback_preparation: string[];
  strategy_confidence: number;

  // Output
  formatted_comment: string;

  errors: string[];
}