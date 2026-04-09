import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminUser,
  fetchAdminUserDetail,
  fetchAdminUsers,
  updateAdminUser,
  type AdminManagedUser,
} from "@/services/api";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: students, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => fetchAdminUsers({ role: "student", search }),
  });

  const { data: selectedUser, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-user", selectedUserId],
    queryFn: () => fetchAdminUserDetail(selectedUserId as number),
    enabled: selectedUserId !== null,
  });

  const [editedUsername, setEditedUsername] = useState("");
  const [editedFullName, setEditedFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const patchUserMutation = useMutation({
    mutationFn: (payload: {
      userId: number;
      data: {
        role?: "student" | "teacher";
        username?: string;
        full_name?: string;
        password?: string;
        is_active?: boolean;
      };
    }) => updateAdminUser(payload.userId, payload.data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user", user.id] });
      setNewPassword("");
    },
    onError: () => {
      alert("Action failed. Please try again.");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => deleteAdminUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      if (selectedUserId !== null) {
        queryClient.removeQueries({ queryKey: ["admin-user", selectedUserId] });
      }
      setSelectedUserId(null);
      setEditedUsername("");
      setEditedFullName("");
      setNewPassword("");
    },
    onError: () => {
      alert("Failed to delete account.");
    },
  });

  const selectedLabel = useMemo(() => {
    if (!selectedUser) return "";
    return selectedUser.full_name || selectedUser.username;
  }, [selectedUser]);

  const handleSelect = (user: AdminManagedUser) => {
    setSelectedUserId(user.id);
    setEditedUsername(user.username);
    setEditedFullName(user.full_name || "");
    setNewPassword("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-muted-foreground">
          Search students, open an account, and manage role, name, password, activation, or deletion.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr,1.5fr]">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 space-y-2">
            <h2 className="font-semibold">Students</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username, email, or name"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading students...</p>
          ) : students?.length ? (
            <ul className="space-y-2">
              {students.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(user)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                      selectedUserId === user.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">{user.full_name || user.username}</div>
                    <div className="text-muted-foreground">@{user.username}</div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No student accounts found.</p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          {selectedUserId === null ? (
            <p className="text-sm text-muted-foreground">Select a student account from the list.</p>
          ) : detailLoading || !selectedUser ? (
            <p className="text-sm text-muted-foreground">Loading account...</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{selectedLabel}</h2>
                <p className="text-sm text-muted-foreground">
                  @{selectedUser.username} {selectedUser.email ? `· ${selectedUser.email}` : ""}
                </p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="admin-full-name">
                  Name
                </label>
                <input
                  id="admin-full-name"
                  type="text"
                  value={editedFullName}
                  onChange={(e) => setEditedFullName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={patchUserMutation.isPending}
                  onClick={() =>
                    patchUserMutation.mutate({
                      userId: selectedUser.id,
                      data: { full_name: editedFullName.trim() },
                    })
                  }
                >
                  Update name
                </Button>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="admin-username">
                  Username
                </label>
                <input
                  id="admin-username"
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={patchUserMutation.isPending || !editedUsername.trim()}
                  onClick={() =>
                    patchUserMutation.mutate({
                      userId: selectedUser.id,
                      data: { username: editedUsername.trim() },
                    })
                  }
                >
                  Update username
                </Button>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="admin-password">
                  Reset password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={patchUserMutation.isPending || newPassword.length < 8}
                  onClick={() =>
                    patchUserMutation.mutate({
                      userId: selectedUser.id,
                      data: { password: newPassword },
                    })
                  }
                >
                  Reset password
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="default"
                  disabled={patchUserMutation.isPending || selectedUser.role === "teacher"}
                  onClick={() =>
                    patchUserMutation.mutate({
                      userId: selectedUser.id,
                      data: { role: "teacher" },
                    })
                  }
                >
                  Make teacher
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={patchUserMutation.isPending || selectedUser.role === "student"}
                  onClick={() =>
                    patchUserMutation.mutate({
                      userId: selectedUser.id,
                      data: { role: "student" },
                    })
                  }
                >
                  Demote to student
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={patchUserMutation.isPending}
                  onClick={() =>
                    patchUserMutation.mutate({
                      userId: selectedUser.id,
                      data: { is_active: !selectedUser.is_active },
                    })
                  }
                >
                  {selectedUser.is_active ? "Deactivate account" : "Activate account"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteUserMutation.isPending}
                  onClick={() => {
                    if (confirm(`Delete account "${selectedUser.username}"?`)) {
                      deleteUserMutation.mutate(selectedUser.id);
                    }
                  }}
                >
                  Delete account
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
