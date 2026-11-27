import type { Metadata } from 'next';
import LoginClient from './LoginClient';
import { buildMetadata } from '@/lib/seo';

// Declared on the page (like /pricing) rather than the layout, so routes
// nested under /login don't inherit the /login canonical (#92). The page
// is a server component because client components can't export metadata;
// the form itself lives in LoginClient.
export const metadata: Metadata = buildMetadata({
  title: 'Log In',
  description: 'Log in to SorobanLard to continue your courses, track progress and claim certificates.',
  path: '/login',
});

export default function LoginPage() {
  return <LoginClient />;
}
