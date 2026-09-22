import { useEffect, useState } from 'react';

/**
 * Delays a fast-changing value so a search box does not fire a request per
 * keystroke. The API rate-limits at 600 requests per 15 minutes per endpoint.
 */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}
