import { useQuery } from "@tanstack/react-query";
import { fetchMyEvents, type CalendarEvent } from "@/services/api"; 
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

function formatEventTime(d: Date | null): string {
  if (!d) return "";
  const parts = d
    .toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].toUpperCase()}`;
}

export default function CalendarPage() {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ["events"],
    queryFn: fetchMyEvents,
  });

  const navigate = useNavigate();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading calendar...</p>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive mb-4">Failed to load calendar events: {error.message}</p>
        <p className="text-muted-foreground">Please refresh or check your connection.</p>
      </div>
    );
  }

  const calendarEvents = (events ?? []).filter((e: CalendarEvent): e is CalendarEvent & {start: string} => !!e.start).map((e) => ({
    id: e.id.toString(),
    title: e.title,
    start: e.start,
    backgroundColor: "#e5e7eb",
    borderColor: "#d1d5db",
    textColor: "#111827",
    extendedProps: {
      description: e.description,
      relatedQuizId: e.related_quiz,
      eventType: e.event_type,
    },
  }));

  const sorted = [...(events ?? [])]
    .filter((e: CalendarEvent) => e.start)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Calendar</h1>
      <p className="text-muted-foreground">
        Quiz deadlines from your enrolled courses appear here automatically.
      </p>

      <div className="rounded-xl border border-border bg-card h-[500px]">
        <ScrollArea className="h-full w-full rounded-xl">
          <div className="p-4 h-full">
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
                    className={`px-1 py-0.5 leading-tight overflow-hidden ${
                      relatedQuizId ? "cursor-pointer" : ""
                    }`}
                  >
                    {time ? (
                      <div className="text-[11px] font-medium whitespace-nowrap">
                        {time}
                      </div>
                    ) : null}
                    <div className="text-[11px] whitespace-normal break-words line-clamp-2">
                      {title}
                    </div>
                  </div>
                );
              }}
              eventClick={(info) => {
                const relatedQuizId = (info.event.extendedProps as any)?.relatedQuizId;
                if (relatedQuizId) {
                  navigate(`/quizview/${relatedQuizId}`);
                  return;
                }

                alert(
                  `${info.event.title}\n${info.event.start?.toLocaleString() ?? ""}\n${
                    (info.event.extendedProps as any)?.description || ""
                  }`
                );
              }}
              height="auto"
              contentHeight="auto"
              aspectRatio={1.35}
              editable={false}
              selectable={false}
            />
          </div>
        </ScrollArea>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {sorted.length ? (
          <ul className="divide-y divide-border">
            {sorted.map((e) => (
              <li
                key={e.id}
                className={`flex flex-wrap items-center gap-4 px-4 py-3 hover:bg-muted/50 ${
                  e.related_quiz ? "cursor-pointer" : ""
                }`}
                onClick={() => {
                  if (e.related_quiz) navigate(`/quizview/${e.related_quiz}`);
                }}
              >
                <div className="min-w-[180px] text-sm text-muted-foreground">
                  {new Date(e.start).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">{e.title}</span>
                  {e.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {e.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-8 text-center text-muted-foreground">
            No events yet. Quiz deadlines will appear when instructors set due dates.
          </div>
        )}
      </div>
    </div>
  );
}