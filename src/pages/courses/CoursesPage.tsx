import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTeacherCoursesPage,
  fetchCoursesPaginated,
  fetchEnrolledCoursesPage,
  createCourse,
  updateCourse,
  deleteCourse,
  type Course,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookOpen, BookOpenText, Clock3, Plus } from "lucide-react";

export default function CoursesPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openCreateCourse, setOpenCreateCourse] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [coursePasskey, setCoursePasskey] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "my">("my");
  const [page, setPage] = useState(1);

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ["courses", viewMode, isTeacher, page],
    queryFn: () => {
      if (isTeacher) {
        return fetchTeacherCoursesPage(page);
      }
      if (viewMode === "all") {
        return fetchCoursesPaginated(page);
      }
      return fetchEnrolledCoursesPage(page);
    },
  });
  const courseList = (coursesData?.results ?? []) as Course[];
  const totalCourses = coursesData?.count ?? courseList.length;
  const totalPages = Math.max(1, Math.ceil(totalCourses / 20));

  const handleViewCourse = (courseId: number) => {
    navigate(`/courses/${courseId}`);
  };

  const createCourseMutation = useMutation({
    mutationFn: (payload: Pick<Course, "title" | "description" | "passkey">) =>
      createCourse(payload),
    onSuccess: () => {
      setOpenCreateCourse(false);
      setCourseTitle("");
      setCourseDescription("");
      setCoursePasskey("");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: () => {
      alert("Failed to create course, a duplicate was found.");
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id: number) => deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: () => {
      alert("Failed to delete course.");
    },
  });

  const toggleCourseMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      updateCourse(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: () => {
      alert("Failed to update course status.");
    },
  });

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) return;
    const payload: Pick<Course, "title" | "description" | "passkey"> = {
      title: courseTitle.trim(),
      description: courseDescription.trim() || undefined,
      passkey: coursePasskey.trim() || undefined,
    };
    createCourseMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-red-500 via-yellow-400 to-orange-500 rounded-2xl animate-spin flex items-center justify-center">
              <Clock3 className="h-5 w-5 text-white" />
          </div>
          <p className="text-slate-400 text-lg">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-red-500 via-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/30">
            <BookOpen className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent leading-tight">
            COURSES
          </h1>
          <p className="mt-4 text-xl text-slate-400 max-w-md mx-auto">
            {isTeacher ? "Manage your courses" : "Browse and join courses"}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            {!isTeacher && (
              <>
                <Button
                  size="sm"
                  variant={viewMode === "all" ? "default" : "outline"}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    viewMode === "all"
                      ? "bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white shadow-lg"
                      : "border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                  }`}
                  onClick={() => {
                    setViewMode("all");
                    setPage(1);
                  }}
                >
                  All Courses
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "my" ? "default" : "outline"}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    viewMode === "my"
                      ? "bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white shadow-lg"
                      : "border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                  }`}
                  onClick={() => {
                    setViewMode("my");
                    setPage(1);
                  }}
                >
                  My Courses
                </Button>
              </>
            )}
          </div>

          {isTeacher && (
            <Dialog open={openCreateCourse} onOpenChange={setOpenCreateCourse}>
              <DialogTrigger asChild>
                <Button className="h-12 px-8 bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/30 hover:brightness-110 transition-all">
                  + New Course
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md rounded-3xl">
                <DialogHeader className="p-8 pb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 via-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <DialogTitle className="text-2xl font-black text-center bg-gradient-to-r from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Create New Course
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-center mt-2">
                    Add a new course that students can enroll in.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCourse} className="p-8 pt-0 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Course Title *</Label>
                    <Input
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="e.g. Advanced JavaScript"
                      className="h-12 rounded-2xl bg-slate-800 border-slate-600 focus:border-yellow-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Description</Label>
                    <Textarea
                      value={courseDescription}
                      onChange={(e) => setCourseDescription(e.target.value)}
                      placeholder="What will students learn?"
                      className="min-h-[80px] rounded-2xl bg-slate-800 border-slate-600 focus:border-yellow-400 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Passkey (optional)</Label>
                    <Input
                      type="password"
                      value={coursePasskey}
                      onChange={(e) => setCoursePasskey(e.target.value)}
                      placeholder="Students will use this to join"
                      className="h-12 rounded-2xl bg-slate-800 border-slate-600 focus:border-yellow-400"
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl shadow-xl hover:brightness-110"
                      disabled={createCourseMutation.isPending || !courseTitle.trim()}
                    >
                      {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {courseList.length ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {courseList.map((course) => (
                <div
                  key={course.id}
                  className="group relative rounded-3xl border border-slate-700 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/50 hover:shadow-red-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => handleViewCourse(course.id)}
                >
                  {isTeacher && course.is_active === false && (
                    <div className="absolute top-4 right-4 bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-medium text-amber-300">
                      Deactivated
                    </div>
                  )}

                  <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-yellow-500/20 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                    <BookOpenText className="h-8 w-8 text-slate-100" />
                  </div>

                  <h2 className="text-2xl font-black text-white mb-4">
                    {course.title}
                  </h2>

                  {course.description && (
                    <p className="text-slate-400 mb-8 leading-relaxed line-clamp-3">
                      {course.description}
                    </p>
                  )}

                  {isTeacher ? (
                    <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/courses/${course.id}`}
                        className="bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold py-3 px-6 rounded-2xl text-center shadow-lg hover:brightness-110 transition-all"
                      >
                        View Course
                      </Link>
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 rounded-2xl border-slate-600 hover:bg-slate-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCourseMutation.mutate({
                              id: course.id,
                              is_active: !(course.is_active ?? true),
                            });
                          }}
                          disabled={toggleCourseMutation.isPending}
                        >
                          {(course.is_active ?? true) ? "Deactivate" : "Reactivate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 rounded-2xl text-red-400 hover:text-red-500 hover:bg-red-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete course "${course.title}" and its quizzes?`)) {
                              deleteCourseMutation.mutate(course.id);
                            }
                          }}
                          disabled={deleteCourseMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-full bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:brightness-110 transition-all"
                      onClick={() => handleViewCourse(course.id)}
                    >
                      View Course
                    </button>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-yellow-400/5 to-orange-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                className="rounded-xl border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-slate-300 text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                className="rounded-xl border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-red-500/20 via-yellow-400/10 to-orange-500/20 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-700">
              <BookOpen className="h-11 w-11 opacity-50 text-slate-200" />
            </div>
            <h2 className="text-2xl font-bold text-slate-400 mb-4">No courses yet</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              {viewMode === "all" ? "No courses available yet." : "You are not enrolled in any courses yet."}
            </p>
            {isTeacher && (
              <Button 
                size="lg" 
                className="mt-8 bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 text-white font-bold px-10 py-3 rounded-2xl shadow-xl hover:brightness-110"
                onClick={() => setOpenCreateCourse(true)}
              >
                Create Your First Course
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}