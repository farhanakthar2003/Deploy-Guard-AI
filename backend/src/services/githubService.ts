import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const WEBHOOK_URL = process.env.WEBHOOK_URL!; // your public backend URL
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

// Register a webhook on a GitHub repo
export const registerWebhook = async (
  repoOwner: string,
  repoName: string,
  pat: string
): Promise<string> => {
  const response = await axios.post(
    `https://api.github.com/repos/${repoOwner}/${repoName}/hooks`,
    {
      name: "web",
      active: true,
      events: ["pull_request"],
      config: {
        url: `${WEBHOOK_URL}/webhook`,
        content_type: "json",
        secret: WEBHOOK_SECRET,
        insecure_ssl: "0"
      }
    },
    {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json"
      }
    }
  );

  // GitHub returns the webhook id — we save this to delete it later
  return String(response.data.id);
};

// Delete a webhook from a GitHub repo
export const deleteWebhook = async (
  repoOwner: string,
  repoName: string,
  pat: string,
  webhookId: string
): Promise<void> => {
  await axios.delete(
    `https://api.github.com/repos/${repoOwner}/${repoName}/hooks/${webhookId}`,
    {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json"
      }
    }
  );
};
