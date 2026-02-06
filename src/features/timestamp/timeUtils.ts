/**
 * Detect if timestamp is in seconds or milliseconds
 */
export function detectTimestampUnit(ts: string): 'seconds' | 'milliseconds' | 'unknown' {
    const numericTs = ts.replace(/\D/g, '');

    if (!numericTs) return 'unknown';

    if (numericTs.length === 10) return 'seconds';
    if (numericTs.length === 13) return 'milliseconds';

    return 'unknown';
}

/**
 * Convert timestamp to date objects with formatted strings
 */
export function timestampToDate(ts: number, isMs: boolean): {
    local: string;
    utc: string;
    date: Date;
} {
    const timestamp = isMs ? ts : ts * 1000;
    const date = new Date(timestamp);

    return {
        local: formatLocalTime(date),
        utc: formatUtcTime(date),
        date,
    };
}

/**
 * Convert date to timestamps
 */
export function dateToTimestamp(date: Date): {
    seconds: number;
    milliseconds: number;
} {
    const milliseconds = date.getTime();
    const seconds = Math.floor(milliseconds / 1000);

    return { seconds, milliseconds };
}

/**
 * Format date as local time: YYYY-MM-DD HH:mm:ss
 */
export function formatLocalTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format date as UTC time: YYYY-MM-DD HH:mm:ss (UTC)
 */
export function formatUtcTime(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (UTC)`;
}

/**
 * Get current time data
 */
export function getCurrentTimestamp(): {
    seconds: number;
    milliseconds: number;
    localDatetime: string;
    date: Date;
} {
    const now = new Date();
    const milliseconds = now.getTime();
    const seconds = Math.floor(milliseconds / 1000);

    // Format for datetime-local input: YYYY-MM-DDTHH:mm:ss
    const localDatetime = formatDatetimeLocal(now);

    return { seconds, milliseconds, localDatetime, date: now };
}

/**
 * Format date for datetime-local input
 */
export function formatDatetimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Validate if a string is a valid timestamp
 */
export function isValidTimestamp(value: string): boolean {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return false;

    const num = parseInt(numericValue, 10);
    if (isNaN(num)) return false;

    // Check if it produces a valid date (between 1970 and 2100 roughly)
    const date = new Date(numericValue.length >= 13 ? num : num * 1000);
    const year = date.getFullYear();

    return year >= 1970 && year <= 2100;
}
