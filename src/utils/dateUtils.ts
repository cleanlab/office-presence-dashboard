/**
 * Compute the upcoming business week (Monday–Friday) based on the given date.
 * If the date is Saturday or Sunday, start from next Monday.
 * Operates in UTC to avoid local timezone shifts.
 * Returns an array of date strings in YYYY-MM-DD format for Monday through Friday.
 */
export function computeDisplayedWeekDates(currentDate: Date): string[] {
  // Normalize to UTC midnight to avoid timezone offsets
  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth();
  const dayOfMonth = currentDate.getUTCDate();

  const todayUTC = new Date(Date.UTC(year, month, dayOfMonth));
  const weekday = todayUTC.getUTCDay(); // Sunday=0, Monday=1, ..., Saturday=6
  const mondayUTC = new Date(todayUTC);

  if (weekday === 0) {
    // Sunday -> next Monday
    mondayUTC.setUTCDate(dayOfMonth + 1);
  } else if (weekday === 6) {
    // Saturday -> next Monday
    mondayUTC.setUTCDate(dayOfMonth + 2);
  } else {
    // Monday (1) to Friday (5) -> this week's Monday
    mondayUTC.setUTCDate(dayOfMonth - (weekday - 1));
  }

  const dates: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(mondayUTC);
    d.setUTCDate(mondayUTC.getUTCDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }

  return dates;
}
