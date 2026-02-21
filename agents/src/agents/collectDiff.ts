import { DeployGuardState } from "../state/deployGuardState";
import { getPRMetadata, getPRFiles } from "../tools/githubTools";

// Files in these paths are considered critical
const CRITICAL_PATTERNS = [
  "auth", "payment", "billing", "security",
  "migration", "database", "db", "config",
  "secret", "env", "gateway", "stripe", "oauth"
];

// Files that indicate DB migrations
const MIGRATION_PATTERNS = [".sql", "migration", "migrate", "schema"];

const isCritical = (filename: string): boolean =>
  CRITICAL_PATTERNS.some((p) => filename.toLowerCase().includes(p));

const isMigration = (filename: string): boolean =>
  MIGRATION_PATTERNS.some((p) => filename.toLowerCase().includes(p));

export const collectDiffAgent = async (
  state: DeployGuardState
): Promise<Partial<DeployGuardState>> => {
  try {
    const { repo_owner, repo_name, pr_number, pat } = state;

    const metadata = await getPRMetadata(repo_owner, repo_name, pr_number, pat);
    const files = await getPRFiles(repo_owner, repo_name, pr_number, pat);

    const changedFiles: string[] = files.map((f: any) => f.filename);
    const criticalFiles = changedFiles.filter(isCritical);
    const migrationDetected = changedFiles.some(isMigration);

    return {
      lines_added: metadata.additions,
      lines_deleted: metadata.deletions,
      total_files_changed: metadata.changed_files,
      changed_files: changedFiles,
      critical_files_touched: criticalFiles,
      migration_files_detected: migrationDetected
    };
  } catch (err: any) {
    return { errors: [...(state.errors || []), `CollectDiff: ${err.message}`] };
  }
};