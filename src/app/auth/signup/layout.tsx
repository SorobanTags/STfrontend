import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Create an Account',
  description:
    'Create a free SorobanLard account and start learning practical, job-ready skills from expert instructors.',
  path: '/auth/signup',
});

export default function AuthSignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
