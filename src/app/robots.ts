import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/courses',
          '/courses/*',
          '/categories/*',
          '/about',
          '/teach',
          '/teams',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/checkout',
          '/checkout/*',
          '/api',
          '/api/*',
          '/auth',
          '/auth/*',
          '/_next/',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
