"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Bell, CheckCheck, Loader2 } from "lucide-react";
import { notificationsApi } from "@/lib/api/services";
import { timeAgo } from "@/lib/utils";
import type { Notification } from "@/types";

const TYPE_COLORS: Record<string, string> = {
  COURSE_APPROVED: "bg-leaf-50 text-leaf-700",
  COURSE_REJECTED: "bg-red-50 text-red-700",
  ENROLLMENT_CONFIRMED: "bg-saffron-50 text-saffron-700",
  COURSE_COMPLETED: "bg-leaf-50 text-leaf-700",
  CERTIFICATE_ISSUED: "bg-saffron-50 text-saffron-700",
  ASSIGNMENT_APPROVED: "bg-leaf-50 text-leaf-700",
  ASSIGNMENT_REJECTED: "bg-red-50 text-red-700",
  ASSIGNMENT_SUBMITTED: "bg-blue-50 text-blue-700",
  PAYMENT_RECEIVED: "bg-leaf-50 text-leaf-700",
  NEW_ENROLLMENT: "bg-saffron-50 text-saffron-700",
  COURSE_ANNOUNCEMENT: "bg-blue-50 text-blue-700",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    notificationsApi
      .list()
      .then((r) => setNotifications(r.data))
      .catch((err) => {
        console.error(err);
        setError(err?.message || "Failed to load notifications");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkAllRead = async () => {
    setError(null);
    try {
      await notificationsApi.markAllRead();
      load();
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to mark all as read";
      setError(message);
    }
  };

  const handleMarkRead = async (id: string) => {
    setError(null);
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to mark notification as read";
      setError(message);
    }
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-heading">Notifications</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllRead} className="btn-secondary text-xs">
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {error && notifications.length > 0 && (
        <div
          role="alert"
          className="mb-4 p-4 rounded-xl border border-red-200 bg-red-50 flex items-center justify-between gap-3 text-sm text-red-700"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-semibold text-red-700 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 text-saffron-400 animate-spin" />
        </div>
      ) : error && notifications.length === 0 ? (
        <div role="alert" className="card p-12 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-900 mb-1">
            Failed to load notifications
          </p>
          <p className="text-xs text-ink-500 mb-4">{error}</p>
          <button onClick={load} className="btn-primary text-xs mx-auto">
            Retry
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-8 h-8 text-saffron-200 mx-auto mb-3" />
          <p className="text-sm text-ink-500">No notifications yet</p>
        </div>
      ) : (
        <ul aria-label="Notifications" className="card divide-y divide-ink-50">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                aria-label={`${n.read ? "Read" : "Unread"} notification: ${n.title}`}
                onClick={() => !n.read && handleMarkRead(n.id)}
                className={`w-full p-4 flex items-start gap-3 text-left transition-colors ${
                  n.read ? "opacity-60" : "cursor-pointer hover:bg-ink-50"
                }`}
              >
                <div
                  aria-hidden="true"
                  className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                    n.read ? "bg-ink-200" : "bg-saffron-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="text-sm font-medium text-ink-900">
                      {n.title}
                    </p>
                    <span
                      className={`badge text-[10px] flex-shrink-0 ${
                        TYPE_COLORS[n.type] ?? "bg-ink-100 text-ink-600"
                      }`}
                    >
                      {n.type === "COURSE_ANNOUNCEMENT"
                        ? "announcement"
                        : n.type.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-ink-400 mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
