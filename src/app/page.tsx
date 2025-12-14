import { cookies } from 'next/headers';
import { HomeClient } from '@/components/HomeClient';

export default async function Home() {
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get('sidebar-visible');
  const initialSidebarVisible = sidebarCookie?.value === 'true' ? true : sidebarCookie?.value === 'false' ? false : true;

  return <HomeClient initialSidebarVisible={initialSidebarVisible} />;
}
