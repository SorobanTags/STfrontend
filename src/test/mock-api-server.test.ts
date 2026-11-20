// @vitest-environment node
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// @ts-expect-error - plain ESM module without type declarations
import { createMockServer } from '../../e2e/mock-api-server.mjs';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createMockServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const get = async (path: string) => {
  const res = await fetch(`${baseUrl}${path}`);
  return { status: res.status, body: await res.json() };
};

describe('mock API server', () => {
  it('reports health', async () => {
    expect(await get('/health')).toEqual({ status: 200, body: { status: 'ok' } });
  });

  it('lists categories', async () => {
    const { status, body } = await get('/api/v1/courses/categories');
    expect(status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: [{ name: 'Web Development', count: 1 }],
    });
  });

  it('filters by search', async () => {
    const hit = await get('/api/v1/courses?search=react');
    expect(hit.body.data.data).toHaveLength(1);
    expect(hit.body.data.data[0].id).toBe('course-react-fundamentals');
    expect(hit.body.data.meta.total).toBe(1);

    const miss = await get('/api/v1/courses?search=zzz');
    expect(miss.body.data.data).toEqual([]);
    expect(miss.body.data.meta.total).toBe(0);
  });

  it('filters by category', async () => {
    const hit = await get('/api/v1/courses?category=Web%20Development');
    expect(hit.body.data.data).toHaveLength(1);
    const miss = await get('/api/v1/courses?category=Design');
    expect(miss.body.data.data).toEqual([]);
  });

  it('paginates with correct meta', async () => {
    const first = await get('/api/v1/courses?page=1&limit=1');
    expect(first.body.data.data).toHaveLength(1);
    expect(first.body.data.meta).toEqual({ total: 1, page: 1, limit: 1, totalPages: 1 });

    const second = await get('/api/v1/courses?page=2&limit=1');
    expect(second.body.data.data).toEqual([]);
    expect(second.body.data.meta.totalPages).toBe(1);
  });

  it('returns a course by id or slug', async () => {
    const byId = await get('/api/v1/courses/course-react-fundamentals');
    expect(byId.status).toBe(200);
    expect(byId.body.success).toBe(true);
    const bySlug = await get('/api/v1/courses/react-fundamentals');
    expect(bySlug.body.data.id).toBe('course-react-fundamentals');
  });

  it('returns 404 for an unknown course', async () => {
    expect(await get('/api/v1/courses/unknown-id')).toEqual({
      status: 404,
      body: { success: false, message: 'Course not found' },
    });
  });
});
