import { createServer } from 'node:http';

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

function respond(response, data, status = 200) {
  response.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Retry-Count',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(data));
}

const server = createServer((request, response) => {
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

  if (pathname === '/api/v1/courses/categories') {
    respond(response, { success: true, data: categories });
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
});

server.listen(port, '127.0.0.1');
