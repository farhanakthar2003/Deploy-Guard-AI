import { DeployGuardState } from "../state/deployGuardState";
import { postPRComment } from "../tools/githubTools";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const actionAgent = async (
  state: DeployGuardState
): Promise<Partial<DeployGuardState>> => {
  try {
    // Post comment to PR on GitHub
    await postPRComment(
      state.repo_owner,
      state.repo_name,
      state.pr_number,
      state.formatted_comment,
      state.pat
    );

    // Save report to Supabase
    await supabase.from("reports").upsert(
      {
        repo_id: state.repo_id,
        pr_number: state.pr_number,
        pr_title: state.pr_title,
        risk_score: state.risk_score,
        risk_level: state.risk_level,
        risk_breakdown: state.risk_breakdown,
        strategy: {
          summary: state.strategy_summary,
          reasoning: state.strategy_reasoning,
          deployment_plan: state.deployment_plan,
          pre_ci_checks_to_add: state.pre_ci_checks_to_add,
          rollback_preparation: state.rollback_preparation,
          confidence: state.strategy_confidence
        },
        formatted_comment: state.formatted_comment
      },
      { onConflict: "repo_id,pr_number" }
    );

    console.log(`DeployGuard report posted for PR #${state.pr_number}`);
    return {};
  } catch (err: any) {
    return {
      errors: [...(state.errors || []), `ActionAgent: ${err.message}`]
    };
  }
};