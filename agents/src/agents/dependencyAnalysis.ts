import { DeployGuardState } from "../state/deployGuardState";
import { getFileContent } from "../tools/githubTools";

// All supported dependency file types
const DEPENDENCY_FILES: Record<string, "json" | "text"> = {
  "package.json": "json",
  "requirements.txt": "text",
  "Pipfile": "text",
  "pom.xml": "text",
  "build.gradle": "text",
  "Gemfile": "text",
  "go.mod": "text",
  "Cargo.toml": "text",
  "composer.json": "json",
  "pubspec.yaml": "text"
};

const parseDeps = (content: string, type: "json" | "text"): Record<string, string> => {
  if (type === "json") {
    try {
      const parsed = JSON.parse(content);
      return {
        ...(parsed.dependencies || {}),
        ...(parsed.devDependencies || {})
      };
    } catch {
      return {};
    }
  }
  // For text-based files, extract name:version pairs best-effort
  const deps: Record<string, string> = {};
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const [name, version] = trimmed.split(/[==@>=<~^]+/);
    if (name) deps[name.trim()] = version?.trim() || "unknown";
  });
  return deps;
};

const getMajorVersion = (version: string): number => {
  const match = version.replace(/[^0-9.]/g, "").match(/^(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

export const dependencyAnalysisAgent = async (
  state: DeployGuardState
): Promise<Partial<DeployGuardState>> => {
  try {
    const { repo_owner, repo_name, base_branch, head_branch, changed_files, pat } = state;

    let majorUpgrades = 0;
    let newDeps = 0;
    let removedDeps = 0;

    // Check each supported dependency file
    for (const [depFile, parseType] of Object.entries(DEPENDENCY_FILES)) {
      // Only process if this file was actually changed in the PR
      const wasChanged = changed_files.some((f) => f.endsWith(depFile));
      if (!wasChanged) continue;

      const baseContent = await getFileContent(
        repo_owner, repo_name, depFile, base_branch, pat
      );
      const headContent = await getFileContent(
        repo_owner, repo_name, depFile, head_branch, pat
      );

      if (!baseContent || !headContent) continue;

      const baseDeps = parseDeps(baseContent, parseType);
      const headDeps = parseDeps(headContent, parseType);

      // Find new and removed packages
      const baseKeys = new Set(Object.keys(baseDeps));
      const headKeys = new Set(Object.keys(headDeps));

      headKeys.forEach((k) => { if (!baseKeys.has(k)) newDeps++; });
      baseKeys.forEach((k) => { if (!headKeys.has(k)) removedDeps++; });

      // Find major version upgrades
      baseKeys.forEach((pkg) => {
        if (!headDeps[pkg]) return;
        const baseMajor = getMajorVersion(baseDeps[pkg]);
        const headMajor = getMajorVersion(headDeps[pkg]);
        if (headMajor > baseMajor) majorUpgrades++;
      });
    }

    return {
      major_dependency_upgrades: majorUpgrades,
      new_dependencies_count: newDeps,
      removed_dependencies_count: removedDeps
    };
  } catch (err: any) {
    return {
      errors: [...(state.errors || []), `DependencyAnalysis: ${err.message}`]
    };
  }
};