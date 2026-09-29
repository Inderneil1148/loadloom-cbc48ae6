import { Bell, CheckCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/use-notifications";
import { fmtDate } from "@/components/app/RecordManager";

export function NotificationBell() {
  const { items, unread, loading, markRead, markAllRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative shrink-0">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-accent">
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && <p className="p-4 text-center text-xs text-muted-foreground">Loading…</p>}
          {!loading && !items.length && <p className="p-6 text-center text-xs text-muted-foreground">No notifications yet.</p>}
          {items.map((n) => {
            const inner = (
              <div className={`flex flex-col gap-0.5 px-3 py-2.5 text-left ${n.read_at ? "opacity-60" : "bg-accent/5"}`}>
                <p className="text-sm font-medium leading-snug">{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                <p className="text-[10px] text-muted-foreground">{fmtDate(n.created_at)}</p>
              </div>
            );
            return n.link ? (
              <Link key={n.id} to={n.link} onClick={() => markRead(n.id)} className="block border-b border-border last:border-0 hover:bg-secondary">
                {inner}
              </Link>
            ) : (
              <button key={n.id} type="button" onClick={() => markRead(n.id)} className="block w-full border-b border-border last:border-0 hover:bg-secondary">
                {inner}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
