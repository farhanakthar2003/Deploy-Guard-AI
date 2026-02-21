import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import { registerWebhook, deleteWebhook } from "../services/githubService";
import { supabase } from "../services/supabaseService";
import { encrypt, decrypt } from "../services/encryptionService";

const router = Router();

// All routes here are protected
router.use(authMiddleware);

// ─── CONNECT A REPO ──────────────────────────────────────

router.post("/", async (req: AuthRequest, res: Response) => {
  const { repo_owner, repo_name, pat } = req.body;
  const userId = req.user!.id;

  if (!repo_owner || !repo_name || !pat) {
    res.status(400).json({ error: "repo_owner, repo_name and pat are required" });
    return;
  }

  try {
    // Register webhook on GitHub
    const webhookId = await registerWebhook(repo_owner, repo_name, pat);

    // Save repo to Supabase
    const encryptedPat = encrypt(pat);
    const { data, error } = await supabase
      .from("repos")
      .insert({
        user_id: userId,
        repo_owner,
        repo_name,
        pat: encryptedPat,
        webhook_id: webhookId
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: "Failed to save repo" });
      return;
    }

    res.status(201).json({ message: "Repo connected successfully", repo: data });
  } catch (err: any) {
    // GitHub rejected the request (wrong PAT, repo not found, etc.)
    res.status(400).json({
      error: "Failed to register webhook on GitHub. Check your PAT and repo details.",
      details: err.response?.data?.message || err.message
    });
  }
});

// ─── GET ALL REPOS FOR LOGGED IN USER ────────────────────
router.get("/", async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const { data, error } = await supabase
    .from("repos")
    .select("id, repo_owner, repo_name, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "Failed to fetch repos" });
    return;
  }

  res.status(200).json({ repos: data });
});

// ─── GET REPORTS FOR A SPECIFIC REPO ─────────────────────
router.get("/:repoId/reports", async (req: AuthRequest, res: Response) => {
  const { repoId } = req.params;
  const userId = req.user!.id;

  // First verify this repo belongs to the logged in user
  const { data: repo, error: repoError } = await supabase
    .from("repos")
    .select("id")
    .eq("id", repoId)
    .eq("user_id", userId)
    .single();

  if (repoError || !repo) {
    res.status(404).json({ error: "Repo not found" });
    return;
  }

  // Fetch reports sorted by latest first
  const { data: reports, error } = await supabase
    .from("reports")
    .select("*")
    .eq("repo_id", repoId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "Failed to fetch reports" });
    return;
  }

  res.status(200).json({ reports });
});

// ─── DELETE A REPO ────────────────────────────────────────
router.delete("/:repoId", async (req: AuthRequest, res: Response) => {
  const { repoId } = req.params;
  const userId = req.user!.id;

  // Fetch the repo to get PAT and webhook_id
  const { data: repo, error: fetchError } = await supabase
    .from("repos")
    .select("*")
    .eq("id", repoId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !repo) {
    res.status(404).json({ error: "Repo not found" });
    return;
  }

  try {
    // Remove webhook from GitHub first
    const decryptedPat = decrypt(repo.pat);
    if (repo.webhook_id) {
      await deleteWebhook(repo.repo_owner, repo.repo_name, decryptedPat, repo.webhook_id);
    }
  } catch (err) {
    // Even if webhook deletion fails, we still remove from our DB
    console.error("Webhook deletion failed on GitHub:", err);
  }

  // Delete repo from Supabase (reports are deleted automatically via cascade)
  const { error: deleteError } = await supabase
    .from("repos")
    .delete()
    .eq("id", repoId)
    .eq("user_id", userId);

  if (deleteError) {
    res.status(500).json({ error: "Failed to delete repo" });
    return;
  }

  res.status(200).json({ message: "Repo and all its reports deleted successfully" });
});

export default router;
