  import { useEffect, useMemo, useState } from "react";
  import { useAuth } from "@/context/AuthContext";
  import { updateCurrentUser, verifyEmailRequest } from "@/services/api";
  import { Button } from "@/components/ui/button";
  import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogClose,
  } from "@/components/ui/dialog";

  export default function ProfilePage() {
    const { user, refreshUser, setUserState, setAvatarPreviewUrl } = useAuth();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [sex, setSex] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);

    useEffect(() => {
      if (!user) return;
      setFullName(user.full_name ?? "");
      setEmail(user.email ?? "");
      setBio(user.bio ?? "");
      setSex(user.sex ?? "");
      setAvatarPreview(null);
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
    }, [user, setAvatarPreviewUrl]);

    useEffect(() => {
      if (!avatarFile) {
        setAvatarPreview(null);
        setAvatarPreviewUrl(null);
        return;
      }

      const objectUrl = URL.createObjectURL(avatarFile);
      setAvatarPreview(objectUrl);
      setAvatarPreviewUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }, [avatarFile, setAvatarPreviewUrl]);

    const profileTitle = useMemo(() => {
      if (user?.role === "teacher") return "Teacher Profile";
      if (user?.role === "admin") return "Admin Profile";
      return "Student Profile";
    }, [user]);

    const profileSubtitle = useMemo(() => {
      if (user?.role === "teacher") {
        return "Manage your teacher profile, courses, and account settings.";
      }
      if (user?.role === "admin") {
        return "Manage your admin profile, settings, and account details.";
      }
      return "Manage your student profile, settings, and account details.";
    }, [user]);

    const courseList = user?.role === "teacher" ? user?.courses : user?.enrolled_courses;
    const currentAvatarSrc = avatarPreview || user?.avatar_url;

    const handleSave = async () => {
      setStatus(null);
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("username", user?.username || "");
        formData.append("email", email.trim());
        formData.append("full_name", fullName.trim());
        formData.append("bio", bio.trim());
        formData.append("sex", sex);
        if (avatarFile) {
          formData.append("avatar_url", avatarFile);
        }

        const updatedUser = await updateCurrentUser(formData);
        setUserState(updatedUser);
        await refreshUser();
        setAvatarFile(null);
        setAvatarPreview(null);
        setAvatarPreviewUrl(null);
        setStatus("saved successfully.");
      } catch (err) {
        let errorMessage = "Could not save profile. Please try again.";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setStatus(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    const handleVerifyEmail = async () => {
      if (!email) {
        setStatus("Enter your email address first to request verification.");
        return;
      }
      setVerifyLoading(true);
      setStatus(null);
      try {
        await verifyEmailRequest(email);
        setStatus("Verification link sent to your email.");
      } catch {
        setStatus("Failed to send verification email. Please try again.");
      } finally {
        setVerifyLoading(false);
      }
    };

    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-white">Loading profile...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-[#1E293B]">{profileTitle}</h1>
                <p className="mt-2 text-base text-muted-foreground">{profileSubtitle}</p>
              </div>

              <div className="flex flex-col items-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-background shadow-xl ring-1 ring-border hover:ring-2 hover:ring-ring transition-all"
                    >
                      {currentAvatarSrc ? (
                        <img
                          src={currentAvatarSrc}
                          alt={`${user.username}'s profile`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl text-white font-medium">
                          {user.username[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </button>
                  </DialogTrigger>

                  {currentAvatarSrc && (
                    <DialogContent className="bg-transparent p-0 shadow-none sm:max-w-[480px] border-none">
                      <div className="relative w-full aspect-square overflow-hidden rounded-3xl bg-slate-950">
                        <img
                          src={currentAvatarSrc}
                          alt={`${user.username}'s profile`}
                          className="w-full h-full object-cover"
                        />
                        <DialogClose className="absolute top-4 right-4 rounded-full bg-black/70 hover:bg-black px-6 py-2 text-sm text-white transition">
                          Close
                        </DialogClose>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full rounded-2xl border border-input bg-background px-5 py-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Email</label>
                <input
                  value={email}
                  type="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-input bg-background px-5 py-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <label className="block text-sm font-semibold text-foreground">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={
                    user.role === "teacher"
                      ? "Share a short teacher bio or your teaching focus."
                      : "Tell us a little about yourself."
                  }
                  className="w-full min-h-[140px] rounded-2xl border border-input bg-background px-5 py-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <label className="block text-sm font-semibold text-foreground">Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="w-full rounded-2xl border border-input bg-background px-5 py-4 text-base file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {avatarFile && (
                  <p className="text-xs text-muted-foreground">
                    New image selected: <span className="font-medium">{avatarFile.name}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-background px-5 py-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full sm:w-auto py-6 text-lg font-medium bg-[#6366F1] hover:bg-[#4F46E5]"
              >
                {loading ? "Saving..." : "Save Profile"}
              </Button>

              {!user.email_verified && (
                <Button
                  variant="outline"
                  onClick={handleVerifyEmail}
                  disabled={verifyLoading}
                  className="w-full sm:w-auto py-6 text-lg"
                >
                  {verifyLoading ? "Sending..." : "Send verification email"}
                </Button>
              )}
            </div>

            {status && (
              <div className="mt-6 rounded-2xl border border-border bg-[#E2E8F0] p-5 text-sm">
                {status}
              </div>
            )}
          </div>

          {courseList?.length ? (
            <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-foreground">
                {user.role === "teacher" ? "Your Courses" : "Enrolled Courses"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {user.role === "teacher"
                  ? "These courses are associated with your teacher profile."
                  : "These are the courses you are enrolled in."}
              </p>
              <div className="mt-6 grid gap-4">
                {courseList.map((title) => (
                  <div key={title} className="rounded-2xl border border-border bg-background px-5 py-4 text-sm text-foreground">
                    {title}
                  </div>
                ))}
              </div>
            </div>
          ) : null} 

          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-foreground">Account settings</h2>
            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>Username:</strong> {user.username}
              </p>
              <p>
                <strong>Role:</strong> {user.role}
              </p>
              <p>
                <strong>Email verification:</strong> {user.email_verified ? "Verified" : "Not verified"}
              </p>
              <p>
                <strong>Password reset:</strong> Password reset requests are blocked until your email is verified.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
