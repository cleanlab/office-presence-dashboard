import { NextResponse } from 'next/server';

const API_URL = 'https://forkable.com/api/v2/mc/admin/deliveries';

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
 */
function postProcessForkableData(apiData: any) {
  const dateMap: Record<string, Record<string, { name: string; email: string | null }>> = {};

  for (const delivery of apiData.deliveries || []) {
    for (const order of delivery.orders || []) {
      for (const piece of order.pieces || []) {
        const date = piece.date;
        if (!date) continue;

        // Identify the user by userId or fallback to email
        const userId = piece.userId ?? piece?.user?.email;
        if (!userId) continue;

        if (!dateMap[date]) {
          dateMap[date] = {};
        }

        // Only add if we haven't seen this user for that date
        if (!dateMap[date][userId]) {
          dateMap[date][userId] = {
            name: piece.userFullName || 'Unknown',
            email: piece?.user?.email || null,
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
  const forkableCookie = process.env.FORKABLE_ADMIN_COOKIE;
  const forkableClubIds = process.env.FORKABLE_CLUB_IDS;

  if (!forkableCookie) {
    return NextResponse.json(
      { error: 'FORKABLE_ADMIN_COOKIE env var is not set' },
      { status: 500 }
    );
  }
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
    const response = await fetch(API_URL, {
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

    const data = await response.json();
    const processed = postProcessForkableData(data);
    return NextResponse.json(processed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
