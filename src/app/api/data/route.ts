import { NextResponse } from 'next/server';

const GRAPHQL_API_URL = 'https://forkable.com/api/v2/graphql';
const DELIVERY_API_URL = 'https://forkable.com/api/v2/mc/admin/deliveries';

/** Minimal shape of the Forkable API data being used */
interface ForkablePiece {
  date?: string;
  userId?: number;
  user?: {
    email?: string;
  };
  userFullName?: string;
  isConfirmed?: boolean; // <-- We added this property
}

interface ForkableOrder {
  pieces?: ForkablePiece[];
}

interface ForkableDelivery {
  orders?: ForkableOrder[];
}

interface ForkableData {
  deliveries?: ForkableDelivery[];
}

// Simple in-memory cache. If the server restarts or scales across multiple instances, this may not persist.
let cachedForkableCookie: string | null = null;
let cachedCookieExpiration: number | null = null;

// 30 days in milliseconds
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Helper to get the _easyorder_session cookie by logging in to Forkable.
 * Caches the cookie in memory for 30 days.
 */
async function getForkableCookie(): Promise<string> {
  // If we already have a cached cookie that hasn't expired, return it.
  if (cachedForkableCookie && cachedCookieExpiration && Date.now() < cachedCookieExpiration) {
    return cachedForkableCookie;
  }

  const email = process.env.FORKABLE_ADMIN_EMAIL;
  const password = process.env.FORKABLE_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('FORKABLE_ADMIN_EMAIL and FORKABLE_ADMIN_PASSWORD must be set');
  }

  // Perform the login request to get the set-cookie header.
  const loginPayload = {
    query: "mutation ($input: CreateSessionInput!) { createSession (input: $input) { errorAttributes user { id email } } }",
    variables: {
      input: {
        email,
        password,
      },
    },
  };

  const response = await fetch(GRAPHQL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(loginPayload),
  });

  if (!response.ok) {
    throw new Error(`Forkable login failed with status ${response.status}`);
  }

  // We need the 'set-cookie' header
  const setCookieHeader = response.headers.get('set-cookie');
  if (!setCookieHeader) {
    throw new Error('Forkable login did not return a set-cookie header');
  }

  // We'll parse out the `_easyorder_session=...` portion from the set-cookie header:
  const match = setCookieHeader.match(/_easyorder_session=[^;]+/);
  if (!match) {
    throw new Error('Could not find _easyorder_session in set-cookie header');
  }
  cachedForkableCookie = match[0];
  cachedCookieExpiration = Date.now() + THIRTY_DAYS_MS;

  return cachedForkableCookie;
}

/**
 * Set date to Monday of this week if it's a weekday, or next Monday if weekend.
 * Uses local time rather than UTC.
 */
function getLocalMondayOrNext(now: Date): Date {
  // Zero out hours to local midnight
  now.setHours(0, 0, 0, 0);

  const dayOfWeek = now.getDay(); // Sunday=0, Monday=1, ..., Saturday=6

  if (dayOfWeek === 6) {
    // Saturday => upcoming Monday is 2 days ahead
    now.setDate(now.getDate() + 2);
  } else if (dayOfWeek === 0) {
    // Sunday => upcoming Monday is 1 day ahead
    now.setDate(now.getDate() + 1);
  } else {
    // Weekday => shift back to Monday
    const offset = dayOfWeek - 1;
    now.setDate(now.getDate() - offset);
  }

  return now;
}

/** Convert a local Date to YYYY-MM-DD. */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns YYYY-MM-DD (local) for Monday of the current week, or next Monday if weekend. */
function getFromDate(): string {
  const now = new Date();
  const monday = getLocalMondayOrNext(now);
  return formatLocalDate(monday);
}

/**
 * Post-processes the Forkable data to produce an object mapping
 * date -> array of unique { name, email } user entries.
 *
 * Only include pieces that have isConfirmed === true.
 */
function postProcessForkableData(apiData: ForkableData) {
  const dateMap: Record<string, Record<string, { name: string; email: string | null }>> = {};

  for (const delivery of apiData.deliveries || []) {
    for (const order of delivery.orders || []) {
      for (const piece of order.pieces || []) {
        // Only include confirmed orders:
        if (!piece.isConfirmed) continue;

        const date = piece.date;
        if (!date) continue;

        // Identify the user by userId or fallback to email
        const userId = piece.userId?.toString() ?? piece.user?.email;
        if (!userId) continue;

        if (!dateMap[date]) {
          dateMap[date] = {};
        }

        // Only add if we haven't seen this user for that date
        if (!dateMap[date][userId]) {
          dateMap[date][userId] = {
            name: piece.userFullName || 'Unknown',
            email: piece.user?.email || null,
          };
        }
      }
    }
  }

  // Convert to { date: [ {name, email}, ... ] }
  const result: Record<string, { name: string; email: string | null }[]> = {};
  for (const date of Object.keys(dateMap)) {
    result[date] = Object.values(dateMap[date]);
  }

  return result;
}

export async function GET() {
  // Environment variables
  const forkableClubIds = process.env.FORKABLE_CLUB_IDS;

  if (!forkableClubIds) {
    return NextResponse.json(
      { error: 'FORKABLE_CLUB_IDS env var is not set' },
      { status: 500 }
    );
  }

  // Parse the comma-separated club IDs into an array
  const clubIds = forkableClubIds
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id));

  // Use our local time-based calculation
  const fromDate = getFromDate();

  try {
    // Get the cookie, possibly from cache, or fresh
    const forkableCookie = await getForkableCookie();

    const response = await fetch(DELIVERY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: forkableCookie,
      },
      body: JSON.stringify({
        clubIds,
        from: fromDate,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Request failed with status ${response.status}` },
        { status: response.status }
      );
    }

    const data: ForkableData = await response.json();
    const processed = postProcessForkableData(data);
    return NextResponse.json(processed);
  } catch (err: unknown) {
    let message = 'Unknown error';
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
