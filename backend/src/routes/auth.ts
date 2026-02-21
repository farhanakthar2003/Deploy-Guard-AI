import { Router, Request, Response } from "express";
import { supabase } from "../services/supabaseService";

const router = Router();

// ─── REGISTER ───────────────────────────────────────────
router.post("/register", async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    res.status(400).json({ error: "Email, password and username are required" });
    return;
  }

  // Create user in Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // auto confirm email so user can login immediately
    user_metadata: { username }
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  // Update the profile with username
  // (profile row is auto-created by our trigger, but username needs to be set)
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", data.user.id);

  if (profileError) {
    res.status(500).json({ error: "User created but profile update failed" });
    return;
  }

  res.status(201).json({ message: "User registered successfully" });
});

// ─── LOGIN ───────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  // Send back the session token and user info
  res.status(200).json({
    message: "Login successful",
    session: data.session,
    user: {
      id: data.user.id,
      email: data.user.email,
      username: data.user.user_metadata?.username
    }
  });
});

// ─── LOGOUT ──────────────────────────────────────────────
router.post("/logout", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(400).json({ error: "No token provided" });
    return;
  }

  const { error } = await supabase.auth.admin.signOut(token);

  if (error) {
    res.status(500).json({ error: "Logout failed" });
    return;
  }

  res.status(200).json({ message: "Logged out successfully" });
});

export default router;