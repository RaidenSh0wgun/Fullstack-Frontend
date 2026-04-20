import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export interface UserProfile {
  id: number;
  username: string;
  full_name?: string;
  email?: string;
  role: string;
  bio?: string;
  sex?: string;
  avatar_url?: string;
}

async function fetchUserProfile(username: string): Promise<UserProfile> {
  const response = await fetch(`/api/users/${username}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return response.json();
}

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user-profile", username],
    queryFn: () => fetchUserProfile(username!),
    enabled: Boolean(username),
  });

  if (!username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-8 text-white">
        <p className="text-slate-400">Invalid user</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 flex items-center justify-center text-white">
        Loading profile...
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-8">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">Failed to load profile</p>
          <p className="text-slate-400 text-sm">User not found.</p>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="mt-4 rounded-2xl border-slate-600 hover:bg-slate-800"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const profileTitle = user.role === "teacher" ? "Teacher Profile" :
                      user.role === "admin" ? "Admin Profile" : "Student Profile";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors mb-4"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {profileTitle}
          </h1>
        </div>

        {/* Profile Info Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-slate-700/50">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.username}'s avatar`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                    <span className="text-4xl text-slate-400">
                      {user.full_name?.charAt(0)?.toUpperCase() || user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex-1 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{user.full_name || user.username}</h2>
                <p className="text-slate-400">@{user.username}</p>
                <p className="text-slate-400 capitalize">{user.role}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Email</p>
                  <p className="text-lg font-semibold text-white">{user.email || "Not available"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Gender</p>
                  <p className="text-lg font-semibold text-white capitalize">{user.sex || "Not specified"}</p>
                </div>
              </div>

              {user.bio && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Bio</p>
                  <p className="text-white mt-1">{user.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="rounded-2xl border-slate-600 hover:bg-slate-800 px-8 py-6 text-lg"
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
