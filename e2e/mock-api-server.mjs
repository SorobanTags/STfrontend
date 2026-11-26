import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const port = Number(process.env.MOCK_API_PORT ?? 3000);

const course = {
  id: 'course-react-fundamentals',
  title: 'React Fundamentals for Beginners',
  slug: 'react-fundamentals',
  description: 'Learn the fundamentals of building interfaces with React.',
  category: 'Web Development',
  level: 'BEGINNER',
  language: 'English',
  thumbnailUrl: null,
  previewVideoUrl: null,
  price: 49.99,
  originalPrice: 99.99,
  platformFeePercent: 10,
  status: 'ACTIVE',
  totalLessons: 12,
  totalDuration: 3600,
  totalEnrollments: 100,
  totalRevenue: 0,
  txHash: null,
  approvedAt: null,
  publishedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  instructor: {
    name: 'Sarah Chen',
    stellarAddress: 'GTESTINSTRUCTOR',
    avatarUrl: null,
  },
  modules: [],
  _count: { enrollments: 100 },
};

const courses = [course];
const categories = [{ name: 'Web Development', count: courses.length }];

const leaderboardEntries = [
  {
    rank: 1,
    user: {
      id: 'user-1',
      name: 'Alice Johnson',
      stellarAddress: 'GALICE',
      avatarUrl: null,
    },
    totalEarnings: 1250.5,
    coursesCompleted: 12,
    coursesCreated: 3,
  },
  {
    rank: 2,
    user: {
      id: 'user-2',
      name: 'Bob Smith',
      stellarAddress: 'GBOB',
      avatarUrl: null,
    },
    totalEarnings: 980.25,
    coursesCompleted: 9,
    coursesCreated: 2,
  },
  {
    rank: 3,
    user: {
      id: 'user-3',
      name: 'Carol Davis',
      stellarAddress: 'GCAROL',
      avatarUrl: null,
    },
    totalEarnings: 745,
    coursesCompleted: 7,
    coursesCreated: 1,
  },
];

const failedLeaderboardPeriods = new Set();

// Notifications feed (#127). Mutable so mark-read persists across requests;
// reset with POST /__test__/notifications/reset at the start of each test.
const notificationFixtures = [
  {
    id: 'notif-enrollment',
    type: 'ENROLLMENT_CONFIRMED',
    title: 'Enrollment confirmed',
    message: 'You are now enrolled in React Fundamentals for Beginners.',
    data: { courseId: course.id },
    read: false,
    createdAt: '2026-01-03T10:00:00.000Z',
  },
  {
    id: 'notif-certificate',
    type: 'CERTIFICATE_ISSUED',
    title: 'Certificate issued',
    message: 'Your certificate for React Fundamentals is ready.',
    data: null,
    read: false,
    createdAt: '2026-01-02T10:00:00.000Z',
  },
  {
    id: 'notif-announcement',
    type: 'COURSE_ANNOUNCEMENT',
    title: 'New module released',
    message: 'Module 4 on hooks is now available.',
    data: null,
    read: false,
    createdAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'notif-payment',
    type: 'PAYMENT_RECEIVED',
    title: 'Payment received',
    message: 'We received your payment of $49.99.',
    data: null,
    read: true,
    createdAt: '2025-12-31T10:00:00.000Z',
  },
];

let notifications = [];

export function resetNotifications() {
  notifications = notificationFixtures.map((n) => ({ ...n }));
}

resetNotifications();

function respond(response, data, status = 200) {
  response.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Retry-Count',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(data));
}

export function createMockApiServer() {
  return createServer(handleRequest);
}

export function handleRequest(request, response) {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Retry-Count',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    });
    response.end();
    return;
  }

  const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
  const { pathname } = url;

  if (pathname === '/health') {
    respond(response, { status: 'ok' });
    return;
  }

  if (pathname === '/__test__/notifications/reset' && request.method === 'POST') {
    resetNotifications();
    respond(response, { success: true });
    return;
  }

  if (pathname === '/api/v1/notifications' && request.method === 'GET') {
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    const data = notifications.filter((n) => !unreadOnly || !n.read);
    respond(response, {
      success: true,
      data: { data, meta: { total: data.length, page: 1, limit: 20, totalPages: 1 } },
    });
    return;
  }

  // The client sends PATCH; POST is accepted too.
  if (
    pathname === '/api/v1/notifications/read-all' &&
    (request.method === 'PATCH' || request.method === 'POST')
  ) {
    notifications = notifications.map((n) => ({ ...n, read: true }));
    respond(response, { success: true, data: null });
    return;
  }

  const readId = pathname.match(/^\/api\/v1\/notifications\/([^/]+)\/read$/)?.[1];
  if (readId && request.method === 'PATCH') {
    const target = notifications.find((n) => n.id === readId);
    if (!target) {
      respond(response, { success: false, message: 'Notification not found' }, 404);
      return;
    }
    target.read = true;
    respond(response, { success: true, data: target });
    return;
  }

  if (pathname === '/api/v1/courses/categories') {
    respond(response, { success: true, data: categories });
    return;
  }

  if (pathname === '/api/v1/leaderboard') {
    const period = url.searchParams.get('period') ?? 'week';
    const failOnce = url.searchParams.get('failOnce') === '1';

    if (failOnce && !failedLeaderboardPeriods.has(period)) {
      failedLeaderboardPeriods.add(period);
      respond(response, { success: false, message: 'Leaderboard unavailable' }, 500);
      return;
    }

    respond(response, {
      success: true,
      data: {
        period,
        entries: leaderboardEntries,
        currentUser: null,
      },
    });
    return;
  }

  if (pathname === '/api/v1/courses') {
    const search = url.searchParams.get('search')?.toLowerCase();
    const category = url.searchParams.get('category');
    const matchingCourses = courses.filter(
      (item) =>
        (!search || item.title.toLowerCase().includes(search)) &&
        (!category || item.category === category),
    );
    const page = Number(url.searchParams.get('page') ?? 1);
    const limit = Number(url.searchParams.get('limit') ?? 8);

    respond(response, {
      success: true,
      data: {
        data: matchingCourses.slice((page - 1) * limit, page * limit),
        meta: {
          total: matchingCourses.length,
          page,
          limit,
          totalPages: Math.ceil(matchingCourses.length / limit),
        },
      },
    });
    return;
  }

  const courseId = pathname.match(/^\/api\/v1\/courses\/([^/]+)$/)?.[1];
  if (courseId) {
    const matchingCourse = courses.find(
      (item) => item.id === courseId || item.slug === courseId,
    );
    respond(
      response,
      matchingCourse
        ? { success: true, data: matchingCourse }
        : { success: false, message: 'Course not found' },
      matchingCourse ? 200 : 404,
    );
    return;
  }

  respond(response, { success: true, data: [] });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  createMockApiServer().listen(port, '127.0.0.1');
}
