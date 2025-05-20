import { NextResponse } from 'next/server';

const API_URL = 'https://forkable.com/api/v2/mc/admin/deliveries';

function getFromDate() {
  // Returns YYYY-MM-DD based on the logic:
  // - If it's a weekday, Monday of that week
  // - If weekend, next Monday
  const now = new Date();
  const dayOfWeek = now.getDay(); // Sunday=0, Monday=1, ... Saturday=6

  if (dayOfWeek === 6) {
    // Saturday => upcoming Monday is 2 days ahead
    now.setDate(now.getDate() + 2);
  } else if (dayOfWeek === 0) {
    // Sunday => upcoming Monday is 1 day ahead
    now.setDate(now.getDate() + 1);
  } else {
    // It's a weekday => set to Monday of this week
    const offset = dayOfWeek - 1;
    now.setDate(now.getDate() - offset);
  }

  // Format as YYYY-MM-DD
  return now.toISOString().split('T')[0];
}

export async function GET() {
  // Get the cookie and club IDs from environment variables
  const forkableCookie = process.env.FORKABLE_ADMIN_COOKIE;
  const forkableClubIds = process.env.FORKABLE_CLUB_IDS;

  // Validate environment variables
  if (!forkableCookie) {
    return NextResponse.json(
      { error: 'FORKABLE_ADMIN_COOKIE env var is not set' },
      { status: 500 },
    );
  }
  if (!forkableClubIds) {
    return NextResponse.json(
      { error: 'FORKABLE_CLUB_IDS env var is not set' },
      { status: 500 },
    );
  }

  // Parse the comma-separated club IDs into an array of integers
  const clubIds = forkableClubIds
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id));

  // Use helper to compute the fromDate
  const fromDate = getFromDate();

  try {
    // Send POST request to Forkable URL
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
        {
          error: `Request failed with status ${response.status}`,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
