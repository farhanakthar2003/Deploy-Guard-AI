import { Annotation, StateGraph } from "@langchain/langgraph";
import { collectDiffAgent } from "./agents/collectDiff";
import { collectMetricsAgent } from "./agents/collectMetrics";
import { dependencyAnalysisAgent } from "./agents/dependencyAnalysis";
import { riskCalculationAgent } from "./agents/riskCalculation";
import { deploymentStrategyAgent } from "./agents/deploymentStrategy";
import { outputFormatterAgent } from "./agents/outputFormatter";
import { actionAgent } from "./agents/actionAgent";

const DeployGuardAnnotation = Annotation.Root({
  repo_owner: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  repo_name: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  repo_id: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  pr_number: Annotation<number>({ reducer: (a, b) => b ?? a, default: () => 0 }),
  pr_sha: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  base_branch: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  head_branch: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  pat: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  pr_title: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  pr_description: Annotation<string | null>({ reducer: (a, b) => b ?? a, default: () => null }),
  author: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  lines_added: Annotation<number>({ reducer: (a, b) => b ?? a, default: () => 0 }),
  lines_deleted: Annotation<number>({ reducer: (a, b) => b ?? a, default: () => 0 }),
  total_files_changed: Annotation<number>({ reducer: (a, b) => b ?? a, default: () => 0 }),
  changed_files: Annotation<string[]>({ reducer: (a, b) => b ?? a, default: () => [] }),
  critical_files_touched: Annotation<string[]>({ reducer: (a, b) => b ?? a, default: () => [] }),
  migration_files_detected: Annotation<boolean>({ reducer: (a, b) => b ?? a, default: () => false }),
  check_runs_summary: Annotation<string[]>({ reducer: (a, b) => b ?? a, default: () => [] }),
  base_branch_last_build_status: Annotation<string | null>({ reducer: (a, b) => b ?? a, default: () => null }),
  major_dependency_upgrades: Annotation<number>({ reducer: (a, b) => b ?? a, default: () => 0 }),
  new_dependencies_count: Annotation<number>({ reducer: (a, b) => b ?? a, default: () => 0 }),
  removed_dependencies_count: Annotation<number>({ reducer: (a, b) => b ?? a, default: () => 0 }),
  risk_score: Annotation<number>({ reducer: (a, b) => b ?? a, default: () => 0 }),
  risk_level: Annotation<"LOW" | "MEDIUM" | "HIGH">({ reducer: (a, b) => b ?? a, default: () => "LOW" }),
  risk_breakdown: Annotation<Record<string, number>>({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  strategy_summary: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  strategy_reasoning: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  deployment_plan: Annotation<string[]>({ reducer: (a, b) => b ?? a, default: () => [] }),
  pre_ci_checks_to_add: Annotation<string[]>({ reducer: (a, b) => b ?? a, default: () => [] }),
  rollback_preparation: Annotation<string[]>({ reducer: (a, b) => b ?? a, default: () => [] }),
  strategy_confidence: Annotation<number>({ reducer: (a, b) => b ?? a, default: () => 0 }),
  formatted_comment: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  errors: Annotation<string[]>({
    reducer: (a, b) => [...(a || []), ...(b || [])],
    default: () => []
  })
});

export const buildDeployGuardGraph = () => {
  const graph = new StateGraph(DeployGuardAnnotation)
    .addNode("collectDiff", collectDiffAgent)
    .addNode("collectMetrics", collectMetricsAgent)
    .addNode("dependencyAnalysis", dependencyAnalysisAgent)
    .addNode("riskCalculation", riskCalculationAgent)
    .addNode("deploymentStrategy", deploymentStrategyAgent)
    .addNode("outputFormatter", outputFormatterAgent)
    .addNode("actionAgent", actionAgent)
    .addEdge("__start__", "collectDiff")
    .addEdge("collectDiff", "collectMetrics")
    .addEdge("collectMetrics", "dependencyAnalysis")
    .addEdge("dependencyAnalysis", "riskCalculation")
    .addEdge("riskCalculation", "deploymentStrategy")
    .addEdge("deploymentStrategy", "outputFormatter")
    .addEdge("outputFormatter", "actionAgent")
    .addEdge("actionAgent", "__end__");

  return graph.compile();
};