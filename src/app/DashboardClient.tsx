"use client";

import { useEffect, useState } from "react";

import { useSession, signOut } from "next-auth/react"; // Optional if you want session in client

interface Person {
  name: string;
  email: string | null;
}

interface ProcessedForkableResponse {
  [date: string]: Person[];
}

function nameToHSL(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
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

  const sortedDates = data ? Object.keys(data).sort() : [];
  const displayedDates = sortedDates.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col items-center justify-between mb-6 gap-2 bg-white rounded-md shadow p-4">
        <h1 className="font-bold text-2xl text-gray-800">
          Cleanlab Office Presence Dashboard
        </h1>
        <p className="text-gray-600 text-sm">
          Check who is planning to come to the office on specific days!
        </p>
      </header>

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
          {displayedDates.map((date, i) => (
            <DayCard
              key={date}
              date={date}
              people={data[date]}
              hoveredName={hoveredName}
              setHoveredName={setHoveredName}
            />
          ))}
        </main>
      )}
    </div>
  );
}
