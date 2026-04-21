import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { confirmEmailVerification } from "@/services/api";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function confirm() {
      if (!uid || !token) {
        setError("Verification link is invalid.");
        return;
      }

      setLoading(true);
      try {
        const response = await confirmEmailVerification(uid, token);
        setStatus(response.message || "Email verified successfully.");
      } catch (err: unknown) {
        setError("Unable to verify email. The link may be invalid or expired.");
      } finally {
        setLoading(false);
      }
    }

    confirm();
  }, [token, uid]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-red-500/20 text-center">
        <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent leading-tight">
          Email Verification
        </h1>

        {loading ? (
          <p className="mt-5 text-slate-400">Verifying your email...</p>
        ) : status ? (
          <>
            <p className="mt-5 text-slate-200">{status}</p>
            <Button
              onClick={() => navigate("/login")}
              className="mt-8 w-full py-3"
            >
              Continue to Login
            </Button>
          </>
        ) : (
          <>
            <p className="mt-5 text-red-300">{error}</p>
            <Button
              onClick={() => navigate("/login")}
              className="mt-8 w-full py-3"
            >
              Back to Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
