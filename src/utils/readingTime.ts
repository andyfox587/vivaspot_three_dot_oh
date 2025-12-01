/**
 * Calculate reading time for content
 * Average reading speed: 200-250 words per minute
 * We use 200 wpm for a conservative estimate that accounts for technical content
 */

const WORDS_PER_MINUTE = 200;

/**
 * Calculate reading time from text content
 * @param content - The text content to analyze
 * @returns Reading time in minutes (minimum 1 minute)
 */
export function calculateReadingTime(content: string): number {
  // Strip HTML tags and extra whitespace
  const text = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();

  // Count words
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

  // Calculate minutes, minimum 1 minute
  const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE);
  return Math.max(1, minutes);
}

/**
 * Format reading time for display
 * @param minutes - Reading time in minutes
 * @returns Formatted string (e.g., "5 min read")
 */
export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}

/**
 * Get formatted reading time from content
 * @param content - The text content to analyze
 * @returns Formatted reading time string
 */
export function getReadingTime(content: string): string {
  const minutes = calculateReadingTime(content);
  return formatReadingTime(minutes);
}
