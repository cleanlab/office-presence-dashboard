"use client";
import { useEffect, useState } from "react";

interface Person {
  name: string;
  email: string | null;
}

interface ProcessedForkableResponse {
  [date: string]: Person[];
}

/**
 * A small helper to format the date string (e.g., "2025-05-19") into
 * short day name (Mon) and a short month/day (May 19) similar to iCal styling.
 */
function formatDateForDisplay(dateStr: string) {
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) {
    // If the date is invalid or something unexpected, return raw
    return { dayName: dateStr, monthDay: "" };
  }
  // Example: "Mon", "May 19"
  const dayName = dt.toLocaleDateString("en-US", { weekday: "short" });
  const monthStr = dt.toLocaleDateString("en-US", { month: "short" });
  const dayNum = dt.toLocaleDateString("en-US", { day: "numeric" });
  return { dayName, monthDay: `${monthStr} ${dayNum}` };
}

/**
 * A modern Apple Calendar–style palette (slightly pastel).
 */
const appleColors = [
  "#FF9F0A", // Orange
  "#FFD60A", // Yellow
  "#32D74B", // Green
  "#64D2FF", // Light Blue
  "#BF5AF2", // Purple
];

/**
 * A component to display a single day's orders in a style reminiscent of Apple iCal.
 */
function DayCard({ date, people, index }: { date: string; people: Person[]; index: number }) {
  const { dayName, monthDay } = formatDateForDisplay(date);
  // Cycle over the color palette for each day.
  const borderColor = appleColors[index % appleColors.length];

  return (
    <div
      className="relative flex flex-col p-4 bg-white shadow-md rounded-md border-l-8"
      style={{ borderLeftColor: borderColor }}
    >
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-gray-800 leading-none">{dayName}</h2>
        <p className="text-sm font-medium text-gray-500">{monthDay}</p>
      </div>
      <div className="flex-1">
        {people.length === 0 ? (
          <p className="text-gray-600 italic mt-2">No one ordered.</p>
        ) : (
          <ul className="space-y-1 mt-1">
            {people.map((p) => (
              <li key={p.email || p.name} className="text-gray-800">
                • {p.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<ProcessedForkableResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/data")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        return res.json();
      })
      .then((json: ProcessedForkableResponse) => {
        setData(json);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  // Convert the returned object keys into a sorted array
  const sortedDates = data ? Object.keys(data).sort() : [];
  // Show only the first 5 days
  const displayedDates = sortedDates.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col items-center justify-between mb-6 gap-2">
        <h1 className="font-semibold text-2xl text-gray-800">
          Cleanlab Office Presence Dashboard
        </h1>
      </header>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 mx-auto max-w-xl">
          Error: {error}
        </div>
      )}

      {/* Center a spinner if loading */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div
            className="w-12 h-12 border-4 border-t-transparent border-gray-400 rounded-full animate-spin"
            aria-label="Loading"
          />
        </div>
      )}

      {!isLoading && data && (
        <main className="grid grid-cols-1 [@media(min-width:900px)]:grid-cols-5 gap-6">
          {displayedDates.map((date, i) => (
            <DayCard key={date} date={date} people={data[date] || []} index={i} />
          ))}
        </main>
      )}
    </div>
  );
}
