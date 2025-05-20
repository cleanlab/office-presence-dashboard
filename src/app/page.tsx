"use client";
import { useEffect, useState } from "react";

/**
 * The shape of the data from /api/data
 * Example:
 * {
 *   "2025-05-19": [{ name: "Alice", email: "alice@example.com" }, ...],
 *   "2025-05-20": [...],
 *   ...
 * }
 */
interface Person {
  name: string;
  email: string | null;
}
interface ProcessedForkableResponse {
  [date: string]: Person[];
}

/**
 * A component to display a single day's orders.
 */
function DayCard({ date, people }: { date: string; people: Person[] }) {
  return (
    <div className="flex flex-col p-4 border rounded-md shadow-sm bg-white min-w-0">
      <h2 className="font-semibold text-lg mb-2">{date}</h2>
      {people.length === 0 ? (
        <p className="text-gray-600 italic">No one ordered.</p>
      ) : (
        <ul className="space-y-1">
          {people.map((p) => (
            <li key={p.email || p.name} className="text-gray-800">
              {p.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<ProcessedForkableResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/data")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        return res.json();
      })
      .then((json: ProcessedForkableResponse) => {
        setData(json);
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, []);

  // Convert the returned object keys to an array, sorted.
  const sortedDates = data ? Object.keys(data).sort() : [];

  // Show only the first 5 days.
  const displayedDates = sortedDates.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col items-center justify-between mb-6 gap-2">
        {/* Title only, no logo */}
        <h1 className="font-semibold text-xl text-gray-800">
          Cleanlab Office Presence Dashboard
        </h1>
      </header>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* Show a centered spinner if loading */}
      {!data && !error && (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div
            className="w-10 h-10 border-4 border-t-transparent border-gray-300 rounded-full animate-spin"
            aria-label="Loading"
          />
        </div>
      )}

      {data && (
        <main className="grid grid-cols-1 [@media(min-width:900px)]:grid-cols-5 gap-4">
          {displayedDates.map((date) => (
            <DayCard key={date} date={date} people={data[date] || []} />
          ))}
        </main>
      )}
    </div>
  );
}
