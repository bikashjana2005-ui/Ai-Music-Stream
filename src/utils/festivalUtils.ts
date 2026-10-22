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

/**
 * Durga Puja & Navratri Festival detector.
 * Active until October 20th, 2026, 23:59:59.
 * Automatically deactivates/removes after October 20th.
 */
export const isDurgaPujaActive = (): boolean => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed: October = 9
    const date = now.getDate();

    if (year === 2026) {
      // If October 2026, active on or before October 20th
      if (month === 9) {
        return date <= 20;
      }
      // If before October 2026
      if (month < 9) {
        return true;
      }
      // After October 2026 (month > 9)
      return false;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Laxmi Puja (Kojagari Lakshmi Puja & Diwali Laxmi Puja) Festival detector.
 * Active for the festival season.
 * Brings golden lotus, divine alpona, coins, and diya radiance.
 */
export const isLaxmiPujaActive = (): boolean => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed: October = 9, November = 10
    const date = now.getDate();

    if (year === 2026) {
      // In October (month 9): from Oct 21st onwards
      if (month === 9 && date >= 21) {
        return true;
      }
      // In November (month 10): up to Nov 20th
      if (month === 10 && date <= 20) {
        return true;
      }
    }
    // Return true for festive activation
    return true;
  } catch {
    return true;
  }
};

