import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { confirmPasswordReset } from "@/services/api";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!uid || !token) {
      setError("Invalid reset link");
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset({
        uid,
        token,
        new_password: newPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      let message = "Failed to reset password. The link may have expired.";

      if (typeof err === "object" && err !== null && "message" in err) {
        try {
          const data = JSON.parse((err as { message: string }).message);
          if (data.error) message = data.error;
        } catch {
          // ignore parse error
        }
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-red-500/20 text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Password Reset!
          </h2>
          <p className="text-slate-400 mb-6 text-sm sm:text-base">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full h-11 sm:h-12 bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 hover:from-red-600 hover:via-yellow-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-red-500/20">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 w-12 h-12 bg-gradient-to-br from-red-500 via-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent leading-tight">
            RESET PASSWORD
          </h1>
        </div>

        <p className="mb-5 text-center text-xs sm:text-sm text-slate-400">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-xs sm:text-sm font-medium text-slate-300" htmlFor="newPassword">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-red-500/30 bg-slate-800/50 px-3 py-2.5 sm:py-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50 transition-all"
              placeholder="At least 8 characters"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-xs sm:text-sm font-medium text-slate-300" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-red-500/30 bg-slate-800/50 px-3 py-2.5 sm:py-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50 transition-all"
              placeholder="Re-enter your password"
            />
          </div>

          {error && (
            <p className="text-xs sm:text-sm text-red-400 px-2 py-1.5 bg-red-500/10 rounded-lg" aria-live="polite">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 sm:h-12 bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 hover:from-red-600 hover:via-yellow-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full h-11 sm:h-12 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
