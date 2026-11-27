import { describe, expect, it, vi } from 'vitest';

vi.mock('./LoginClient', () => ({ default: () => null }));

import * as layout from './layout';
import { metadata } from './page';
import { absoluteUrl } from '@/lib/seo';

describe('/login metadata (#92)', () => {
  it('is declared on the page with the /login canonical', () => {
    expect(metadata.title).toBe('Log In');
    expect(metadata.alternates?.canonical).toBe(absoluteUrl('/login'));
    expect(metadata.openGraph?.url).toBe(absoluteUrl('/login'));
  });

  it('is no longer exported by the layout', () => {
    expect('metadata' in layout).toBe(false);
  });
});
