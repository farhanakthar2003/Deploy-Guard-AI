import { Request, Response, NextFunction } from "express";
import { supabase } from "../services/supabaseService";

// Extend Request type to carry user info
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Unauthorized — no token provided" });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: "Unauthorized — invalid or expired token" });
    return;
  }

  // Attach user to request so routes can use it
  req.user = {
    id: data.user.id,
    email: data.user.email!
  };

  next();
};