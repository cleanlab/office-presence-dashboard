"use client";

import { useEffect, useState } from "react";
import { sha256 } from "js-sha256";

interface Person {
  name: string;
  email: string | null;
}

interface ProcessedForkableResponse {
  [date: string]: Person[];
}

function nameToHSL(name: string) {
  // Use js-sha256 to generate a robust hash
  const hashedString = sha256(name);
  // Convert some portion of the hash to a number
  const hashedNumber = parseInt(hashedString.slice(0, 8), 16);
  // Map to 0–359 range to pick a unique Hue
  const hue = hashedNumber % 360;

  return {
    backgroundColor: `hsl(${hue}, 70%, 90%)`,
    color: `hsl(${hue}, 30%, 30%)`,
  };
}

function formatDateForDisplay(dateStr: string) {
  const dt = new Date(dateStr + "T12:00:00Z");
  if (isNaN(dt.getTime())) {
    return { dayName: dateStr, monthDay: "" };
  }
  const dayName = dt.toLocaleDateString("en-US", { weekday: "short" });
  const monthStr = dt.toLocaleDateString("en-US", { month: "short" });
  const dayNum = dt.toLocaleDateString("en-US", { day: "numeric" });
  return { dayName, monthDay: `${monthStr} ${dayNum}` };
}

interface DayCardProps {
  date: string;
  people: Person[];
  hoveredName: string | null;
  setHoveredName: (name: string | null) => void;
}

function DayCard({ date, people, hoveredName, setHoveredName }: DayCardProps) {
  const { dayName, monthDay } = formatDateForDisplay(date);
  const borderColor = "#9CA3AF";

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
          <ul className="flex flex-wrap gap-2 mt-1">
            {people.map((p) => {
              const { backgroundColor, color } = nameToHSL(p.name);
              const isDimmed = hoveredName && hoveredName !== p.name;
              return (
                <li
                  key={p.email || p.name}
                  className="px-3 py-1 rounded-full text-sm transition-colors duration-200"
                  style={
                    isDimmed
                      ? { backgroundColor: "#E5E7EB", color: "#9CA3AF" }
                      : { backgroundColor, color }
                  }
                  onMouseEnter={() => setHoveredName(p.name)}
                  onMouseLeave={() => setHoveredName(null)}
                >
                  {p.name}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const [data, setData] = useState<ProcessedForkableResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/data")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
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

  // Compute the upcoming business week (Monday–Friday). If today is Saturday or Sunday, start next week
  const displayedDates = (() => {
    const today = new Date();
    const day = today.getDay(); // Sunday = 0, Saturday = 6
    const monday = new Date(today);
    if (day === 0) {
      // Sunday -> next Monday
      monday.setDate(today.getDate() + 1);
    } else if (day === 6) {
      // Saturday -> next Monday
      monday.setDate(today.getDate() + 2);
    } else {
      // Monday to Friday -> this week's Monday
      monday.setDate(today.getDate() - (day - 1));
    }
    // Generate Monday through Friday dates as YYYY-MM-DD
    return Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 mx-auto max-w-xl">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div
            className="w-12 h-12 border-4 border-t-transparent border-gray-400 rounded-full animate-spin"
            aria-label="Loading"
          />
        </div>
      )}

      {!isLoading && data && (
        <main className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {displayedDates.map((date) => (
            <DayCard
              key={date}
              date={date}
              people={data[date] || []}
              hoveredName={hoveredName}
              setHoveredName={setHoveredName}
            />
          ))}
        </main>
      )}
    </div>
  );
}
