import { useState } from "react";
import axios from "axios";
import { supabase } from "../lib/supabaseClient";

interface Report {
  id: string;
  pr_number: number;
  pr_title: string;
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  risk_breakdown: Record<string, number>;
  strategy: {
    summary: string;
    reasoning: string;
    deployment_plan: string[];
    pre_ci_checks_to_add: string[];
    rollback_preparation: string[];
    confidence: number;
  };
  created_at: string;
}

interface Repo {
  id: string;
  repo_owner: string;
  repo_name: string;
  created_at: string;
}

interface Props {
  repo: Repo;
  onDeleted: () => void;
}

const riskColor = (level: string) => {
  if (level === "HIGH") return "text-red-400 bg-red-900/30 border-red-700";
  if (level === "MEDIUM") return "text-yellow-400 bg-yellow-900/30 border-yellow-700";
  return "text-green-400 bg-green-900/30 border-green-700";
};

const riskEmoji = (level: string) => {
  if (level === "HIGH") return "🔴";
  if (level === "MEDIUM") return "🟡";
  return "🟢";
};

export default function RepoCard({ repo, onDeleted }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadReports = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setLoadingReports(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/repos/${repo.id}/reports`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(res.data.reports);
      setExpanded(true);
    } catch (err) {
      console.error("Failed to load reports");
    } finally {
      setLoadingReports(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${repo.repo_owner}/${repo.repo_name}? This will remove all reports.`)) return;
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/repos/${repo.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onDeleted();
    } catch (err) {
      console.error("Failed to delete repo");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Repo Header */}
      <div className="p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-lg">
              {repo.repo_owner}/{repo.repo_name}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Connected {new Date(repo.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadReports}
            disabled={loadingReports}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition"
          >
            {loadingReports ? "Loading..." : expanded ? "Hide Reports" : "View Reports"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-2 bg-red-900/30 hover:bg-red-900/60 text-red-400 text-sm rounded-lg border border-red-800 transition"
          >
            {deleting ? "..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Reports List */}
      {expanded && (
        <div className="border-t border-gray-800">
          {reports.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No reports yet. Open a PR on this repo to trigger analysis.
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                  className="p-4 hover:bg-gray-800/50 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-300 text-sm font-medium">
                        PR #{report.pr_number} — {report.pr_title}
                      </span>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${riskColor(report.risk_level)}`}>
                      {riskEmoji(report.risk_level)} {report.risk_level} — {report.risk_score}/100
                    </span>
                  </div>

                  {/* Expanded Report Detail */}
                  {selectedReport?.id === report.id && (
                    <div className="mt-4 space-y-4 text-sm" onClick={(e) => e.stopPropagation()}>

                      {/* Risk Breakdown */}
                      <div className="bg-gray-800 rounded-xl p-4">
                        <h4 className="text-white font-semibold mb-3">📊 Risk Breakdown</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(report.risk_breakdown).map(([key, val]) => (
                            <div key={key} className="flex justify-between bg-gray-700/50 px-3 py-2 rounded-lg">
                              <span className="text-gray-400 capitalize">{key.replace("_", " ")}</span>
                              <span className="text-white font-semibold">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Strategy Summary */}
                      <div className="bg-gray-800 rounded-xl p-4">
                        <h4 className="text-white font-semibold mb-2">🧠 Strategy Summary</h4>
                        <p className="text-gray-300">{report.strategy.summary}</p>
                        <p className="text-gray-400 mt-2 text-xs">{report.strategy.reasoning}</p>
                      </div>

                      {/* Deployment Plan */}
                      <div className="bg-gray-800 rounded-xl p-4">
                        <h4 className="text-white font-semibold mb-2">🚀 Deployment Plan</h4>
                        <ul className="space-y-1">
                          {report.strategy.deployment_plan.map((step, i) => (
                            <li key={i} className="text-gray-300 flex gap-2">
                              <span className="text-blue-400">→</span> {step}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Pre CI Checks */}
                      <div className="bg-gray-800 rounded-xl p-4">
                        <h4 className="text-white font-semibold mb-2">✅ Pre-CI Checks to Add</h4>
                        <ul className="space-y-1">
                          {report.strategy.pre_ci_checks_to_add.map((check, i) => (
                            <li key={i} className="text-gray-300 flex gap-2">
                              <span className="text-green-400">✓</span> {check}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Rollback */}
                      <div className="bg-gray-800 rounded-xl p-4">
                        <h4 className="text-white font-semibold mb-2">🔄 Rollback Preparation</h4>
                        <ul className="space-y-1">
                          {report.strategy.rollback_preparation.map((step, i) => (
                            <li key={i} className="text-gray-300 flex gap-2">
                              <span className="text-yellow-400">⚠</span> {step}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <p className="text-gray-500 text-xs text-right">
                        Confidence: {report.strategy.confidence}%
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}