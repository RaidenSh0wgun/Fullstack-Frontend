import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: { from?: { pathname?: string } };
  };

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login({ username, password });
      } else {
        await register({ username, password, email });
      }

      const redirectTo = location.state?.from?.pathname ?? "/";
      navigate(redirectTo, { replace: true });

    } catch (err: unknown) {
      let message =
        "Something went wrong. Please check your details and try again.";

      if (typeof err === "object" && err !== null) {
        const maybeAxiosError = err as {
          response?: { data?: { detail?: string } };
        };

        if (maybeAxiosError.response?.data?.detail) {
          message = maybeAxiosError.response.data.detail;
        }
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950 flex items-center justify-center p-4 sm:p-6">
      {/* Slightly wider: max-w-md (448px) - perfect balance */}
      <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-red-500/20">
        {/* Compact header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 w-12 h-12 bg-gradient-to-br from-red-500 via-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🕒</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent leading-tight">
            QUIZ TIME
          </h1>
        </div>

        <h2 className="mb-1 text-center text-xl sm:text-2xl font-semibold text-white">
          {mode === "login" ? "Login" : "Register"}
        </h2>

        <p className="mb-5 text-center text-xs sm:text-sm text-slate-400">
          {mode === "login"
            ? "Sign in to your existing account."
            : "Create an account."}
        </p>

        {/* Compact mode toggle */}
        <div className="mb-5 flex gap-1.5 sm:gap-2 rounded-xl bg-slate-800/50 p-0.5 sm:p-1 border border-red-500/20">
          <button
            type="button"
            className={`flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
              mode === "login"
                ? "bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
              mode === "register"
                ? "bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-xs sm:text-sm font-medium text-slate-300" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-red-500/30 bg-slate-800/50 px-3 py-2.5 sm:py-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50 transition-all"
            />
          </div>

          {mode === "register" && (
            <div className="space-y-1 text-left">
              <label className="text-xs sm:text-sm font-medium text-slate-300" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-red-500/30 bg-slate-800/50 px-3 py-2.5 sm:py-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50 transition-all"
              />
            </div>
          )}

          <div className="space-y-1 text-left">
            <label className="text-xs sm:text-sm font-medium text-slate-300" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-red-500/30 bg-slate-800/50 px-3 py-2.5 sm:py-3 pr-10 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs sm:text-sm text-red-400 px-2 py-1.5 bg-red-500/10 rounded-lg" aria-live="polite">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-11 sm:h-12 bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 hover:from-red-600 hover:via-yellow-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all"
            disabled={loading}
          >
            {loading
              ? mode === "login"
                ? "Logging in..."
                : "Creating account..."
              : mode === "login"
              ? "Login"
              : "Register"}
          </Button>

          {mode === "login" && (
            <div className="text-center pt-2">
              <a href="/forgot-password" className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
                Forgot password?
              </a>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}