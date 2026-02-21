import axios from "axios";

const githubApi = (pat: string) =>
  axios.create({
    baseURL: "https://api.github.com",
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github+json"
    }
  });

// ─── PR METADATA ─────────────────────────────────────────
export const getPRMetadata = async (
  owner: string,
  repo: string,
  prNumber: number,
  pat: string
) => {
  const res = await githubApi(pat).get(
    `/repos/${owner}/${repo}/pulls/${prNumber}`
  );
  return res.data;
};

// ─── PR FILES ─────────────────────────────────────────────
export const getPRFiles = async (
  owner: string,
  repo: string,
  prNumber: number,
  pat: string
) => {
  const res = await githubApi(pat).get(
    `/repos/${owner}/${repo}/pulls/${prNumber}/files`
  );
  return res.data;
};

// ─── CHECK RUNS FOR A SHA ─────────────────────────────────
export const getCheckRunsForSha = async (
  owner: string,
  repo: string,
  sha: string,
  pat: string
) => {
  const res = await githubApi(pat).get(
    `/repos/${owner}/${repo}/commits/${sha}/check-runs`
  );
  return res.data.check_runs;
};

// ─── LATEST COMMIT ON A BRANCH ───────────────────────────
export const getLatestCommitOnBranch = async (
  owner: string,
  repo: string,
  branch: string,
  pat: string
) => {
  const res = await githubApi(pat).get(
    `/repos/${owner}/${repo}/commits/${branch}`
  );
  return res.data.sha;
};

// ─── FILE CONTENT ─────────────────────────────────────────
export const getFileContent = async (
  owner: string,
  repo: string,
  filePath: string,
  ref: string,
  pat: string
): Promise<string | null> => {
  try {
    const res = await githubApi(pat).get(
      `/repos/${owner}/${repo}/contents/${filePath}?ref=${ref}`
    );
    // Content is base64 encoded
    const decoded = Buffer.from(res.data.content, "base64").toString("utf-8");
    return decoded;
  } catch {
    // File might not exist on this branch
    return null;
  }
};

// ─── POST COMMENT ON PR ───────────────────────────────────
export const postPRComment = async (
  owner: string,
  repo: string,
  prNumber: number,
  body: string,
  pat: string
) => {
  await githubApi(pat).post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
    body
  });
};