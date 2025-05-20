import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function Page() {
  // Server-side session check
  const session = await getServerSession(authOptions);
  if (!session) {
    // Redirect to login if not authenticated
    redirect('/login');
  }

  return <DashboardClient />;
}
