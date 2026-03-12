import { useQuery } from "@tanstack/react-query";
import { fetchMyEvents } from "@/services/api";

export default function CalendarPage() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: fetchMyEvents,
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Loading calendar...</p>;
  }

  const sorted = [...(events ?? [])].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Calendar</h1>
      <p className="text-muted-foreground">
        Quiz deadlines from your enrolled courses appear here automatically.
      </p>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {sorted.length ? (
          <ul className="divide-y divide-border">
            {sorted.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-4 px-4 py-3 hover:bg-muted/50"
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
