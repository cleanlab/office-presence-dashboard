"use client";
import Image from "next/image";
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

  // Convert the returned object keys to an array and sort them.
  const sortedDates = data ? Object.keys(data).sort() : [];

  // Show only first 5 days, if you prefer.
  const displayedDates = sortedDates.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-2">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={25}
            priority
          />
          <h1 className="font-semibold text-xl text-gray-800">
            Weekly Meal Orders
          </h1>
        </div>
      </header>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {!data && !error && (
        <div className="text-gray-600">Loading…</div>
      )}

      {data && (
        <main className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {displayedDates.map((date) => (
            <DayCard key={date} date={date} people={data[date] || []} />
          ))}
        </main>
      )}

      <footer className="mt-8 text-sm text-center text-gray-500">
        Powered by Next.js + Tailwind
      </footer>
    </div>
  );
}
