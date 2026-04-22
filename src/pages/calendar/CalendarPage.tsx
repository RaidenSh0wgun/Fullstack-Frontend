import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchCalendarQuizzes, type Quiz } from "@/services/api";
import FullCalendar from "@fullcalendar/react";
import type { EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function formatEventTime(d: Date | null): string {
  if (!d) return "";
  return d
    .toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
}

export default function CalendarPage() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const { data: quizzes, isLoading, isFetching, error } = useQuery({
    queryKey: ["calendar-quizzes"],
    queryFn: fetchCalendarQuizzes,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const navigate = useNavigate();

  if (isLoading && !quizzes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 flex items-center justify-center">
        <div className="w-full max-w-3xl space-y-4">
          <div className="h-8 w-52 rounded-lg bg-slate-800/80 animate-pulse" />
          <div className="h-72 rounded-2xl bg-slate-900/80 border border-slate-700 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-900/80 border border-slate-700 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">Failed to load events</p>
          <p className="text-slate-400 text-sm">Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const calendarEvents: EventInput[] = (quizzes ?? [])
    .filter((quiz: Quiz) => !!quiz.due_date)
    .map((quiz) => {
      const dueDate = new Date(quiz.due_date!);
      const now = new Date();
      const isAttempted = quiz.has_attempted ?? false;
      const isMissed = !isAttempted && dueDate < now;
      const status = isAttempted ? "completed" : isMissed ? "missed" : "pending";

      const palette = {
        completed: { background: "#10b981", border: "#059669", text: "#ffffff" },
        pending: { background: "#f59e0b", border: "#d97706", text: "#111827" },
        missed: { background: "#ef4444", border: "#b91c1c", text: "#ffffff" },
      }[status];

      return {
        id: quiz.id.toString(),
        title: quiz.title,
        start: quiz.due_date!,
        ...(isStudent
          ? {
              backgroundColor: palette.background,
              borderColor: palette.border,
              textColor: palette.text,
            }
          : {}),
        display: "block",
        extendedProps: {
          description: quiz.description,
          courseId: quiz.course,
          status,
        },
      };
    });

  const sortedEvents = [...(quizzes ?? [])]
    .filter((quiz: Quiz) => quiz.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Calendar</h1>
          <p className="text-slate-400 mt-1 text-base">
            Quiz deadlines and course schedules
          </p>
        </div>

        <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 md:p-6 shadow-xl">
          {isFetching && (
            <div className="absolute right-4 top-4 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[11px] uppercase tracking-wide text-amber-300">
              Updating...
            </div>
          )}
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,listWeek",
            }}
            events={calendarEvents}
            eventDisplay="block"
            eventContent={(arg) => {
              const courseId = (arg.event.extendedProps as any)?.courseId;
              const status = (arg.event.extendedProps as any)?.status as string | undefined;
              const time = formatEventTime(arg.event.start);
              const title = arg.event.title || "";
              const isMonth = arg.view.type === "dayGridMonth";
              const statusLabel =
                status === "completed"
                  ? "COMPLETED"
                  : status === "missed"
                  ? "MISSED"
                  : "PENDING";

              return (
                <div
                  className={`${
                    isMonth ? "px-2 py-1 rounded-md" : "px-3 py-2 rounded-lg"
                  } text-xs leading-tight overflow-hidden transition-all ${
                    courseId ? "cursor-pointer hover:bg-yellow-400/20" : ""
                  }`}
                >
                  {time && (
                    <div className={`font-medium text-amber-300 ${isMonth ? "mb-0" : "mb-0.5"}`}>
                      {time}
                    </div>
                  )}
                  <div
                    className={`font-medium text-white ${isMonth ? "line-clamp-1" : "line-clamp-2"} break-words`}
                  >
                    {title}
                  </div>
                  {isStudent && (
                    <div
                      className={`${isMonth ? "mt-0.5" : "mt-1"} text-[10px] uppercase tracking-widest text-slate-300`}
                    >
                      {statusLabel}
                    </div>
                  )}
                </div>
              );
            }}
            eventClick={(info) => {
              const quizId = info.event.id;
              const courseId = (info.event.extendedProps as any)?.courseId;
              if (!isStudent && courseId) {
                navigate(`/courses/${courseId}`);
                return;
              }
              if (quizId) {
                navigate(`/quizview/${quizId}`);
              } else {
                alert(
                  `${info.event.title}\n${info.event.start?.toLocaleString() ?? ""}`
                );
              }
            }}
            eventClassNames={(arg) =>
              isStudent
                ? [
                    (arg.event.extendedProps as any)?.status === "completed"
                      ? "fc-event-completed"
                      : (arg.event.extendedProps as any)?.status === "missed"
                      ? "fc-event-missed"
                      : "fc-event-pending",
                  ]
                : []
            }
            height="auto"
            contentHeight="auto"
            aspectRatio={1.9}
            editable={false}
            selectable={false}
            dayMaxEvents={1}
            moreLinkClassNames="text-white hover:text-white"
          />
        </div>

        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl p-5 md:p-7 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-5">Upcoming Quizzes</h2>

          {sortedEvents.length > 0 ? (
            <div className="space-y-3">
              {sortedEvents.map((quiz) => (
                <div
                  key={quiz.id}
                  onClick={() => navigate(`/quizview/${quiz.id}`)}
                  className={`flex flex-col sm:flex-row gap-4 bg-slate-950 border border-slate-700 hover:border-amber-400/50 rounded-xl p-5 transition-all cursor-pointer group ${
                    quiz.has_attempted ? "hover:bg-slate-900" : ""
                  }`}
                >
                  <div className="sm:w-28 flex-shrink-0 text-sm">
                    <div className="font-medium text-slate-300">
                      {new Date(quiz.due_date!).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-amber-300 text-xs mt-1">
                      {new Date(quiz.due_date!).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white group-hover:text-amber-300 transition-colors text-base">
                      {quiz.title}
                    </p>
                    {quiz.description && (
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}
                  </div>

                  <div className="text-[10px] uppercase tracking-widest font-medium px-3 py-1 rounded-md self-start sm:self-center">
                    {quiz.has_attempted ? (
                      <span className="text-emerald-400 bg-emerald-400/10">COMPLETED</span>
                    ) : new Date(quiz.due_date!).getTime() < Date.now() ? (
                      <span className="text-red-400 bg-red-400/10">MISSED</span>
                    ) : (
                      <span className="text-amber-400 bg-amber-400/10">PENDING</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No upcoming quizzes</p>
              <p className="text-slate-500 text-sm mt-2">
                Quiz deadlines will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}