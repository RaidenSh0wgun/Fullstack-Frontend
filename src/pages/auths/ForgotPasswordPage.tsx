import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "@/services/api";
import { KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const response = await requestPasswordReset({ email });
      setSuccessMessage(response.message || "If an account with that email exists, a password reset link has been sent.");
    } catch (err: unknown) {
      let message = "Failed to send reset email. Please try again.";

      if (typeof err === "object" && err !== null && "message" in err) {
        try {
          const data = JSON.parse((err as { message: string }).message);
          if (data.error) message = data.error;
          if (data.detail) message = data.detail;
        } catch {}
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-red-500/20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Check Your Email
          </h2>
          <p className="text-slate-400 mb-6 text-sm sm:text-base">
            {successMessage}
          </p>
          <p className="text-slate-500 text-xs sm:text-sm mb-6">
            If you do not receive anything, check your spam folder and make sure your email is verified.
          </p>
          <button
            onClick={() => {
              setSuccessMessage(null);
              setEmail("");
            }}
            className="w-full h-11 sm:h-12 bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 hover:from-red-600 hover:via-yellow-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all mb-3"
          >
            Try Another Email
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full h-11 sm:h-12 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-lg transition-all"
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
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent leading-tight">
            FORGOT PASSWORD?
          </h1>
        </div>

        <p className="mb-5 text-center text-xs sm:text-sm text-slate-400">
          Enter your email and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-xs sm:text-sm font-medium text-slate-300" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-red-500/30 bg-slate-800/50 px-3 py-2.5 sm:py-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50 transition-all"
              placeholder="you@example.com"
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
            {loading ? "Sending..." : "Send Reset Link"}
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
