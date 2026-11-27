import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import NotificationsPage from "./page";
import { notificationsApi } from "@/lib/api/services";

vi.mock("@/lib/api/services", () => ({
  notificationsApi: {
    list: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

const mockNotifications = [
  {
    id: "notif-1",
    userId: "user-1",
    type: "COURSE_APPROVED",
    title: "Course Approved",
    message: "Your course has been approved.",
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "notif-2",
    userId: "user-1",
    type: "PAYMENT_RECEIVED",
    title: "Payment Received",
    message: "You received a payment.",
    read: true,
    createdAt: new Date().toISOString(),
  },
];

describe("NotificationsPage Error State & Accessibility (#125)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an error message and Retry button when notificationsApi.list() rejects", async () => {
    vi.mocked(notificationsApi.list).mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load notifications"),
      ).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
      expect(
        screen.queryByText("No notifications yet"),
      ).not.toBeInTheDocument();
    });
  });

  it("retries fetching notifications when Retry button is clicked", async () => {
    vi.mocked(notificationsApi.list)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ data: mockNotifications, status: 200 } as any);

    render(<NotificationsPage />);

    const retryButton = await screen.findByRole("button", { name: "Retry" });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(notificationsApi.list).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Course Approved")).toBeInTheDocument();
    });
  });

  it("leaves notification unread and displays an inline error when markRead rejects", async () => {
    vi.mocked(notificationsApi.list).mockResolvedValueOnce({
      data: mockNotifications,
      status: 200,
    } as any);
    vi.mocked(notificationsApi.markRead).mockRejectedValueOnce(
      new Error("Failed to update"),
    );

    render(<NotificationsPage />);

    const unreadButton = await screen.findByRole("button", {
      name: "Unread notification: Course Approved",
    });
    fireEvent.click(unreadButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to update")).toBeInTheDocument();
      // notification should still remain unread in the list
      expect(
        screen.getByRole("button", {
          name: "Unread notification: Course Approved",
        }),
      ).toBeInTheDocument();
    });
  });

  it("renders list with accessible names when notifications load successfully", async () => {
    vi.mocked(notificationsApi.list).mockResolvedValueOnce({
      data: mockNotifications,
      status: 200,
    } as any);

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("list", { name: "Notifications" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: "Unread notification: Course Approved",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: "Read notification: Payment Received",
        }),
      ).toBeInTheDocument();
    });
  });
});
