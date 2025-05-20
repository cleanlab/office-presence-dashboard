import { NextResponse } from 'next/server';

const API_URL = 'https://forkable.com/api/v2/mc/admin/deliveries';

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

  const fromDate = '2025-05-19'; // Hard-coded at present

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
