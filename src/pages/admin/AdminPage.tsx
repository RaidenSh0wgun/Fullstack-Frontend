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
import { UserRound } from "lucide-react";

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
    queryFn: () => fetchAdminUserDetail(selectedUserId!),
    enabled: !!selectedUserId,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user", selectedUserId] });
      setNewPassword("");
    },
    onError: () => alert("Action failed. Please try again."),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => deleteAdminUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      if (selectedUserId) queryClient.removeQueries({ queryKey: ["admin-user", selectedUserId] });
      setSelectedUserId(null);
      setEditedUsername("");
      setEditedFullName("");
      setNewPassword("");
    },
    onError: () => alert("Failed to delete account."),
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
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Manage student accounts — search, edit, change roles, reset passwords, and delete.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">All Students</h2>
                <p className="text-base text-muted-foreground">Click any student to manage</p>
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by username, name or email..."
                className="w-full rounded-xl border border-input bg-background px-5 py-4 text-base placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />

              <div className="mt-6 max-h-[75vh] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {isLoading ? (
                  <p className="text-center py-12 text-lg text-muted-foreground">Loading students...</p>
                ) : students?.length ? (
                  students.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelect(user)}
                      className={`w-full text-left rounded-2xl border p-5 transition-all hover:shadow-md ${
                        selectedUserId === user.id
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border hover:border-muted-foreground/40 hover:bg-muted"
                      }`}
                    >
                      <div className="text-xl font-semibold text-foreground">
                        {user.full_name || user.username}
                      </div>
                      <div className="text-lg text-muted-foreground mt-1">@{user.username}</div>
                      {user.email && (
                        <div className="text-base text-muted-foreground mt-1 truncate">
                          {user.email}
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-center py-12 text-lg text-muted-foreground">
                    No students found.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7"> 
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm min-h-[600px]">
              {selectedUserId === null ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                  <div className="mb-6 rounded-full bg-muted p-5 text-muted-foreground">
                    <UserRound className="h-12 w-12" />
                  </div>
                  <h3 className="text-2xl font-medium text-foreground">No student selected</h3>
                  <p className="text-lg text-muted-foreground mt-3 max-w-md">
                    Choose a student from the list on the left to edit their account details.
                  </p>
                </div>
              ) : detailLoading || !selectedUser ? (
                <p className="text-center py-20 text-xl text-muted-foreground">Loading account details...</p>
              ) : (
                <div className="space-y-10">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">{selectedLabel}</h2>
                    <p className="text-2xl text-muted-foreground mt-2">
                      @{selectedUser.username}
                      {selectedUser.email && ` • ${selectedUser.email}`}
                    </p>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-3">
                      <label className="text-xl font-semibold text-foreground block">Full Name</label>
                      <input
                        type="text"
                        value={editedFullName}
                        onChange={(e) => setEditedFullName(e.target.value)}
                        className="w-full rounded-2xl border border-input bg-background px-5 py-4 text-lg focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <Button
                        onClick={() =>
                          patchUserMutation.mutate({
                            userId: selectedUser.id,
                            data: { full_name: editedFullName.trim() },
                          })
                        }
                        disabled={patchUserMutation.isPending}
                        className="w-full py-6 text-lg"
                      >
                        Update Full Name
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xl font-semibold text-foreground block">Username</label>
                      <input
                        type="text"
                        value={editedUsername}
                        onChange={(e) => setEditedUsername(e.target.value)}
                        className="w-full rounded-2xl border border-input bg-background px-5 py-4 text-lg focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <Button
                        onClick={() =>
                          patchUserMutation.mutate({
                            userId: selectedUser.id,
                            data: { username: editedUsername.trim() },
                          })
                        }
                        disabled={patchUserMutation.isPending || !editedUsername.trim()}
                        className="w-full py-6 text-lg"
                      >
                        Update Username
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xl font-semibold text-foreground block">Reset Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full rounded-2xl border border-input bg-background px-5 py-4 text-lg focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <Button
                      onClick={() =>
                        patchUserMutation.mutate({
                          userId: selectedUser.id,
                          data: { password: newPassword },
                        })
                      }
                      disabled={patchUserMutation.isPending || newPassword.length < 8}
                      className="w-full py-6 text-lg"
                    >
                      Reset Password
                    </Button>
                  </div>

                  <div className="pt-6 border-t">
                    <p className="text-xl font-semibold mb-4">Account Actions</p>
                    <div className="flex flex-wrap gap-4">
                      <Button
                        onClick={() =>
                          patchUserMutation.mutate({ userId: selectedUser.id, data: { role: "teacher" } })
                        }
                        disabled={patchUserMutation.isPending || selectedUser.role === "teacher"}
                        className="flex-1 min-w-[180px] py-6 text-lg"
                      >
                        Make Teacher
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() =>
                          patchUserMutation.mutate({ userId: selectedUser.id, data: { role: "student" } })
                        }
                        disabled={patchUserMutation.isPending || selectedUser.role === "student"}
                        className="flex-1 min-w-[180px] py-6 text-lg"
                      >
                        Demote to Student
                      </Button>

                      <Button
                        variant={selectedUser.is_active ? "outline" : "default"}
                        onClick={() =>
                          patchUserMutation.mutate({
                            userId: selectedUser.id,
                            data: { is_active: !selectedUser.is_active },
                          })
                        }
                        disabled={patchUserMutation.isPending}
                        className="flex-1 min-w-[180px] py-6 text-lg"
                      >
                        {selectedUser.is_active ? "Deactivate" : "Activate"} Account
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (confirm(`Delete account "${selectedUser.username}"? This cannot be undone.`))
                            deleteUserMutation.mutate(selectedUser.id);
                        }}
                        disabled={deleteUserMutation.isPending}
                        className="flex-1 min-w-[180px] py-6 text-lg"
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}