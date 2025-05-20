import { NextResponse } from 'next/server';

export async function GET() {
  // Use the DATA_URL environment variable
  const dataUrl = process.env.DATA_URL;

  if (!dataUrl) {
    return NextResponse.json(
      { error: 'DATA_URL env var is not set' },
      { status: 500 }
    );
  }

  try {
    // Fetch the data from the external URL (with secret or query param if necessary)
    const response = await fetch(dataUrl);
    const data = await response.json();

    // Return the fetched data as JSON
    return NextResponse.json(data);
  } catch (error: any) {
    // In case of any errors, respond with a JSON error message
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
