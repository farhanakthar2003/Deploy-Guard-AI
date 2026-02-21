import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export const verifyWebhookSignature = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const signature = req.headers["x-hub-signature-256"] as string;

  if (!signature) {
    res.status(401).json({ error: "No signature found" });
    return;
  }

  const secret = process.env.WEBHOOK_SECRET!;
  const body = req.body as Buffer;

  // GitHub signs the payload using your webhook secret
  // We recompute the signature and compare
  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(body).digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    res.status(401).json({ error: "Invalid webhook signature" });
    return;
  }

  next();
};