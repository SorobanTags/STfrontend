/** Fallback colour classes for unknown notification types. */
export const NOTIFICATION_TYPE_FALLBACK_COLOR = 'bg-ink-100 text-ink-600';

/** Map notification type → badge colour classes. */
export const TYPE_COLORS: Record<string, string> = {
  COURSE_APPROVED: 'bg-leaf-50 text-leaf-700',
  COURSE_REJECTED: 'bg-red-50 text-red-700',
  ENROLLMENT_CONFIRMED: 'bg-saffron-50 text-saffron-700',
  COURSE_COMPLETED: 'bg-leaf-50 text-leaf-700',
  CERTIFICATE_ISSUED: 'bg-saffron-50 text-saffron-700',
  ASSIGNMENT_APPROVED: 'bg-leaf-50 text-leaf-700',
  ASSIGNMENT_REJECTED: 'bg-red-50 text-red-700',
  ASSIGNMENT_SUBMITTED: 'bg-blue-50 text-blue-700',
  PAYMENT_RECEIVED: 'bg-leaf-50 text-leaf-700',
  NEW_ENROLLMENT: 'bg-saffron-50 text-saffron-700',
  COURSE_ANNOUNCEMENT: 'bg-blue-50 text-blue-700',
};

/** Badge colour classes for a notification type, with a safe fallback. */
export function getNotificationTypeColor(type: string): string {
  return TYPE_COLORS[type] ?? NOTIFICATION_TYPE_FALLBACK_COLOR;
}

/** Humanised label for a notification type. */
export function getNotificationTypeLabel(type: string): string {
  if (type === 'COURSE_ANNOUNCEMENT') return 'announcement';
  return type.replace(/_/g, ' ').toLowerCase();
}
