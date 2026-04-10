import { useQuery } from "@tanstack/react-query";
import { fetchMyEvents, type CalendarEvent } from "@/services/api";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { useNavigate } from "react-router-dom";

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
  const { data: events, isLoading, error } = useQuery({
    queryKey: ["events"],
    queryFn: fetchMyEvents,
  });

  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 flex items-center justify-center">
        <p className="text-lg text-slate-400">Loading calendar...</p>
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

  const calendarEvents = (events ?? [])
    .filter((e: CalendarEvent) => !!e.start)
    .map((e) => ({
      id: e.id.toString(),
      title: e.title,
      start: e.start,
      backgroundColor: "#ca8a04",
      borderColor: "#eab308",
      textColor: "#111827",
      extendedProps: {
        description: e.description,
        relatedQuizId: e.related_quiz,
      },
    }));

  const sortedEvents = [...(events ?? [])]
    .filter((e: CalendarEvent) => e.start)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">Calendar</h1>
          <p className="text-slate-400 mt-1 text-base">
            Quiz deadlines and course events
          </p>
        </div>

        {/* Calendar */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 md:p-6 shadow-xl">
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
              const relatedQuizId = (arg.event.extendedProps as any)?.relatedQuizId;
              const time = formatEventTime(arg.event.start);
              const title = arg.event.title || "";

              return (
                <div
                  className={`px-3 py-2 text-xs rounded-lg leading-tight overflow-hidden transition-all ${
                    relatedQuizId ? "cursor-pointer hover:bg-yellow-400/20" : ""
                  }`}
                >
                  {time && (
                    <div className="font-medium text-amber-300 mb-0.5">{time}</div>
                  )}
                  <div className="font-medium text-white line-clamp-2 break-words">
                    {title}
                  </div>
                </div>
              );
            }}
            eventClick={(info) => {
              const relatedQuizId = (info.event.extendedProps as any)?.relatedQuizId;
              if (relatedQuizId) {
                navigate(`/quiz/${relatedQuizId}`);
              } else {
                alert(
                  `${info.event.title}\n${info.event.start?.toLocaleString() ?? ""}`
                );
              }
            }}
            height="auto"
            contentHeight="auto"
            aspectRatio={1.9}
            editable={false}
            selectable={false}
            dayMaxEvents={3}
          />
        </div>

        {/* Upcoming Events - Compact List */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl p-5 md:p-7 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-5">Upcoming Events</h2>

          {sortedEvents.length > 0 ? (
            <div className="space-y-3">
              {sortedEvents.map((e) => (
                <div
                  key={e.id}
                  onClick={() => e.related_quiz && navigate(`/quiz/${e.related_quiz}`)}
                  className={`flex flex-col sm:flex-row gap-4 bg-slate-950 border border-slate-700 hover:border-amber-400/50 rounded-xl p-5 transition-all cursor-pointer group ${
                    e.related_quiz ? "hover:bg-slate-900" : ""
                  }`}
                >
                  {/* Date */}
                  <div className="sm:w-28 flex-shrink-0 text-sm">
                    <div className="font-medium text-slate-300">
                      {new Date(e.start).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-amber-300 text-xs mt-1">
                      {new Date(e.start).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {/* Title + Description */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white group-hover:text-amber-300 transition-colors text-base">
                      {e.title}
                    </p>
                    {e.description && (
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                        {e.description}
                      </p>
                    )}
                  </div>

                  {/* Quiz Badge */}
                  {e.related_quiz && (
                    <div className="text-[10px] uppercase tracking-widest font-medium text-amber-400 self-start sm:self-center bg-amber-400/10 px-3 py-1 rounded-md">
                      QUIZ →
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No upcoming events</p>
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