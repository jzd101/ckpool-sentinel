/**
 * Hashrate normalizer and formatter utilities.
 * Base internal unit for continuous graph representation is TH/s (Terahashes/second).
 */

/**
 * Parses raw string or number into normalized numeric TH/s.
 * Examples: "1.8T" -> 1.8, "500G" -> 0.5, "1.5P" -> 1500, "100M" -> 0.0001
 */
export function parseHashrateToTh(val: string | number | null | undefined): number {
  if (val === null || val === undefined || val === "") {
    return 0;
  }

  if (typeof val === "number") {
    return isNaN(val) ? 0 : val;
  }

  const str = String(val).trim().toUpperCase();
  if (str === "0" || str === "") {
    return 0;
  }

  // Check unit suffix
  const match = str.match(/^([0-9.]+)\s*([PTGMK])?/);
  if (!match) {
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  const num = parseFloat(match[1]);
  if (isNaN(num)) {
    return 0;
  }

  const unit = match[2];
  switch (unit) {
    case "P":
      return num * 1000;
    case "T":
      return num;
    case "G":
      return num / 1000;
    case "M":
      return num / 1000000;
    case "K":
      return num / 1000000000;
    default:
      return num;
  }
}

/**
 * Formats a numeric TH/s value back to human-readable string with dynamic unit.
 */
export function formatHashrateTh(thValue: number): string {
  if (isNaN(thValue) || thValue <= 0) {
    return "0.00 TH/s";
  }

  if (thValue >= 1000) {
    return `${(thValue / 1000).toFixed(2)} PH/s`;
  }
  if (thValue >= 1) {
    return `${thValue.toFixed(2)} TH/s`;
  }
  if (thValue >= 0.001) {
    return `${(thValue * 1000).toFixed(2)} GH/s`;
  }
  return `${(thValue * 1000000).toFixed(2)} MH/s`;
}

/**
 * Formats numbers with comma separators (e.g. 1,819,992,546).
 */
export function formatNumberWithCommas(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return "0";
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(n)) return "0";

  const parts = n.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

/**
 * Formats a UNIX timestamp into relative time (e.g. "2m ago", "1h ago", "just now").
 */
export function formatTimestampRelative(timestampInSeconds: number | null | undefined): string {
  if (!timestampInSeconds || timestampInSeconds <= 0) {
    return "N/A";
  }

  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestampInSeconds;

  if (diff < 0) return "just now";
  if (diff < 30) return "just now";
  if (diff < 60) return `${diff}s ago`;

  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
