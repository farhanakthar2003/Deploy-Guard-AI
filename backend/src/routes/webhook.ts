import { Router, Request, Response } from "express";
import { verifyWebhookSignature } from "../middleware/verifyWebhook";
import { supabase } from "../services/supabaseService";
import { exec } from "child_process";
import path from "path";
import { decrypt } from "../services/encryptionService";


const router = Router();

router.post("/", verifyWebhookSignature, async (req: Request, res: Response) => {
  const payload = JSON.parse(req.body.toString());
  const event = req.headers["x-github-event"] as string;

  if (event !== "pull_request") {
    res.status(200).json({ message: "Event ignored" });
    return;
  }

  const allowedActions = ["opened", "synchronize", "reopened"];
  if (!allowedActions.includes(payload.action)) {
    res.status(200).json({ message: "PR action ignored" });
    return;
  }

  const repoOwner = payload.repository.owner.login;
  const repoName = payload.repository.name;
  const prNumber = payload.pull_request.number;
  const prSha = payload.pull_request.head.sha;
  const baseBranch = payload.pull_request.base.ref;
  const headBranch = payload.pull_request.head.ref;
  const prTitle = payload.pull_request.title;
  const prDescription = payload.pull_request.body || null;
  const author = payload.pull_request.user.login;

  const { data: repo, error } = await supabase
    .from("repos")
    .select("id, pat")
    .eq("repo_owner", repoOwner)
    .eq("repo_name", repoName)
    .single();

  if (error || !repo) {
    console.error("Repo not found in DB for webhook event");
    res.status(200).json({ message: "Repo not registered in DeployGuard" });
    return;
  }

  // Respond to GitHub immediately
  res.status(200).json({ message: "Webhook received — DeployGuard analysis started" });

  // Build context to pass to agents
  const context = JSON.stringify({
    repo_owner: repoOwner,
    repo_name: repoName,
    repo_id: repo.id,
    pr_number: prNumber,
    pr_sha: prSha,
    base_branch: baseBranch,
    head_branch: headBranch,
    pr_title: prTitle,
    pr_description: prDescription,
    author,
    pat: decrypt(repo.pat)
  });

  // Path to agents entry point
  const agentEntry = path.resolve(__dirname, "../../../agents/src/index.ts");

  console.log(`Triggering agent pipeline for PR #${prNumber}...`);

  const command = `npx ts-node "${agentEntry}"`;

  // Run agents as a subprocess
  exec(
  command,
  {
    env: {
      ...process.env,
      DEPLOY_GUARD_CONTEXT: context
    },
    timeout: 300000,
    cwd: path.resolve(__dirname, "../../../agents")
  },
  (err, stdout, stderr) => {
    if (err) {
      console.error("Agent pipeline error:", stderr || err.message);
    } else {
      console.log("Agent pipeline completed:", stdout);
    }
  }
);
});

export default router;