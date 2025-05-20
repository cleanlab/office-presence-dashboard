// src/app/api/data/route.ts
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

const GRAPHQL_API_URL = 'https://forkable.com/api/v2/graphql';
const DELIVERY_API_URL = 'https://forkable.com/api/v2/mc/admin/deliveries';

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

/** Minimal shape of the Forkable API data being used */
interface ForkablePiece {
  date?: string;
  userId?: number;
  user?: { email?: string };
  userFullName?: string;
  isConfirmed?: boolean;
}
interface ForkableOrder { pieces?: ForkablePiece[]; }
interface ForkableDelivery { orders?: ForkableOrder[]; }
interface ForkableData { deliveries?: ForkableDelivery[]; }

/**
 * Uses Next.js unstable_cache to cache the Forkable cookie for 30 days.
 * If expired, logs in again to retrieve a fresh one.
 */
const getForkableCookie = unstable_cache(async (): Promise<string> => {
  const email = process.env.FORKABLE_ADMIN_EMAIL;
  const password = process.env.FORKABLE_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('FORKABLE_ADMIN_EMAIL and FORKABLE_ADMIN_PASSWORD must be set');

  const loginPayload = {
    query: 'mutation ($input: CreateSessionInput!) { createSession (input: $input) { errorAttributes user { id email } } }',
    variables: { input: { email, password } },
  };
  const res = await fetch(GRAPHQL_API_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginPayload),
  });
  if (!res.ok) throw new Error(`Forkable login failed: ${res.status}`);

  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) throw new Error('Missing set-cookie header');
  const match = setCookie.match(/_easyorder_session=[^;]+/);
  if (!match) throw new Error('Could not parse session cookie');
  return match[0];
}, ['forkableCookie'], { revalidate: THIRTY_DAYS_SECONDS });

/** Date helpers omitted for brevity… */
function getLocalMondayOrNext(now: Date) {
  now.setHours(0,0,0,0);
  const d = now.getDay();
  if (d === 6) now.setDate(now.getDate()+2);
  else if (d === 0) now.setDate(now.getDate()+1);
  else now.setDate(now.getDate() - (d-1));
  return now;
}
function formatLocalDate(date: Date): string {
  const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function getFromDate(): string { return formatLocalDate(getLocalMondayOrNext(new Date())); }
function postProcessForkableData(apiData: ForkableData) {
  const dateMap: Record<string, Record<string,{name:string,email:string|null}>>={};
  for (const del of apiData.deliveries||[]) for (const ord of del.orders||[]) for (const p of ord.pieces||[]) {
    if (!p.isConfirmed || !p.date) continue;
    const userId = p.userId?.toString() ?? p.user?.email;
    if (!userId) continue;
    dateMap[p.date] ??= {};
    dateMap[p.date][userId] ??= { name: p.userFullName||'Unknown', email: p.user?.email||null };
  }
  return Object.fromEntries(Object.entries(dateMap).map(([d, m])=>[d, Object.values(m)]));
}

export async function GET() {
  // Protect route
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const forkableClubIds = process.env.FORKABLE_CLUB_IDS;
  if (!forkableClubIds) {
    return NextResponse.json({ error: 'FORKABLE_CLUB_IDS is missing' }, { status: 500 });
  }

  const clubIds = forkableClubIds.split(',').map(s=>parseInt(s,10)).filter(n=>!isNaN(n));
  const from = getFromDate();

  try {
    const cookie = await getForkableCookie();
    const res = await fetch(DELIVERY_API_URL, {
      method:'POST', headers:{ 'Content-Type':'application/json', Cookie:cookie },
      body: JSON.stringify({ clubIds, from }),
    });
    if (!res.ok) return NextResponse.json({ error:`status ${res.status}` }, { status: res.status });
    const data: ForkableData = await res.json();
    return NextResponse.json(postProcessForkableData(data));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
