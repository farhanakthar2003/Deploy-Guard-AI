import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import RepoCard from "../components/RepoCard";
import ConnectRepoModal from "../components/ConnectRepoModal";

interface Repo {
  id: string;
  repo_owner: string;
  repo_name: string;
  created_at: string;
}

export default function Dashboard() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchRepos = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/repos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRepos(res.data.repos);
    } catch (err) {
      console.error("Failed to fetch repos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
    supabase.auth.getUser().then(({ data }) => {
      setUsername(data.user?.user_metadata?.username || data.user?.email || "");
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const filteredRepos = repos.filter((repo) =>
    `${repo.repo_owner}/${repo.repo_name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">🛡 DeployGuard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">👤 {username}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Repositories</h2>
            <p className="text-gray-400 text-sm mt-1">
              DeployGuard monitors these repos for PR risk analysis
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition flex items-center gap-2"
          >
            + Connect Repo
          </button>
        </div>

        {/* Search Bar */}
        {repos.length > 0 && (
          <div className="mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search repositories..."
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Repos */}
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading...</div>
        ) : repos.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-700 rounded-2xl">
            <p className="text-4xl mb-4">🛡</p>
            <p className="text-white font-semibold text-lg">No repos connected yet</p>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              Connect a GitHub repo to start getting PR risk analysis
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
            >
              + Connect Your First Repo
            </button>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-700 rounded-2xl">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-white font-semibold">No repos found</p>
            <p className="text-gray-500 text-sm mt-2">
              No repositories match "<span className="text-gray-300">{search}</span>"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRepos.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                onDeleted={fetchRepos}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ConnectRepoModal
          onClose={() => setShowModal(false)}
          onRepoAdded={fetchRepos}
        />
      )}
    </div>
  );
}