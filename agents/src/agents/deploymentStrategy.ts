import { DeployGuardState } from "../state/deployGuardState";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const deploymentStrategyAgent = async (
  state: DeployGuardState
): Promise<Partial<DeployGuardState>> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a senior DevOps engineer reviewing a Pull Request.

Here is the PR analysis:
- PR Title: ${state.pr_title}
- Author: ${state.author}
- Risk Score: ${state.risk_score} (${state.risk_level})
- Lines Added: ${state.lines_added}, Lines Deleted: ${state.lines_deleted}
- Files Changed: ${state.total_files_changed}
- Critical Files Touched: ${state.critical_files_touched.join(", ") || "none"}
- Migration Files Detected: ${state.migration_files_detected}
- Major Dependency Upgrades: ${state.major_dependency_upgrades}
- New Dependencies: ${state.new_dependencies_count}
- CI Check Runs: ${state.check_runs_summary.join(", ") || "none"}

Based on this, respond ONLY with a valid JSON object in this exact format with no markdown or code blocks:
{
  "summary": "one sentence summary of the risk",
  "reasoning": "2-3 sentences explaining why this risk level was assigned",
  "deployment_plan": ["step 1", "step 2", "step 3"],
  "pre_ci_checks_to_add": ["check 1", "check 2"],
  "rollback_preparation": ["step 1", "step 2"],
  "confidence": 85
}

Be specific to the actual files and changes. Do not give generic advice.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Strip markdown code blocks if Gemini adds them
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      strategy_summary: parsed.summary,
      strategy_reasoning: parsed.reasoning,
      deployment_plan: parsed.deployment_plan,
      pre_ci_checks_to_add: parsed.pre_ci_checks_to_add,
      rollback_preparation: parsed.rollback_preparation,
      strategy_confidence: parsed.confidence
    };
  } catch (err: any) {
    return {
      errors: [...(state.errors || []), `DeploymentStrategy: ${err.message}`]
    };
  }
};


