/**
 * Festival and seasonal theme detector.
 * Automatically enables festive effects for specific calendar dates and
 * deactivates automatically when the day passes.
 */

export const isRakshaBandhanToday = (): boolean => {
  try {
    const now = new Date();
    // Raksha Bandhan 2026 falls on August 28, 2026 (Month is 0-indexed: August = 7)
    return now.getFullYear() === 2026 && now.getMonth() === 7 && now.getDate() === 28;
  } catch {
    return false;
  }
};
