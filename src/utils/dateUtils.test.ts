import { computeDisplayedWeekDates } from './dateUtils';

describe('computeDisplayedWeekDates', () => {
  it('returns Monday through Friday for a Monday date', () => {
    const date = new Date('2025-06-09T00:00:00Z'); // Monday
    const result = computeDisplayedWeekDates(date);
    expect(result).toEqual([
      '2025-06-09',
      '2025-06-10',
      '2025-06-11',
      '2025-06-12',
      '2025-06-13',
    ]);
  });

  it('works regardless of time of day in UTC', () => {
    const date = new Date('2025-06-09T15:45:30Z'); // Monday afternoon
    const result = computeDisplayedWeekDates(date);
    expect(result[0]).toBe('2025-06-09');
    expect(result).toHaveLength(5);
  });

  it('rolls forward weekend dates to next Monday', () => {
    const sunday = new Date('2025-06-08T00:00:00Z'); // Sunday
    expect(computeDisplayedWeekDates(sunday)[0]).toBe('2025-06-09');

    const saturday = new Date('2025-06-07T23:59:59Z'); // Saturday just before midnight
    expect(computeDisplayedWeekDates(saturday)[0]).toBe('2025-06-09');
  });

  it('handles midweek dates by returning the week start as Monday', () => {
    const wednesday = new Date('2025-06-11T00:00:00Z'); // Wednesday
    const result = computeDisplayedWeekDates(wednesday);
    expect(result[0]).toBe('2025-06-09'); // Monday of that week
    expect(result).toHaveLength(5);
  });

  it('handles month and year boundaries correctly', () => {
    // Wednesday Dec 31, 2025
    const endOfYear = new Date('2025-12-31T00:00:00Z');
    const result = computeDisplayedWeekDates(endOfYear);
    expect(result).toEqual([
      '2025-12-29', // Monday
      '2025-12-30',
      '2025-12-31',
      '2026-01-01',
      '2026-01-02',
    ]);
  });

  it('is affected by timezone offset when parsing non-UTC strings', () => {
    // ISO string with -05:00 offset for Monday June 9, 2025 at 00:00 local => 2025-06-09T05:00:00Z
    const tzDate = new Date('2025-06-09T00:00:00-05:00');
    const result = computeDisplayedWeekDates(tzDate);
    // Since normalization uses UTC date, this shifts to June 9 UTC being June 9 local => UTC date 2025-06-09 -> OK
    expect(result[0]).toBe('2025-06-09');
  });
});
