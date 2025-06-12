export const isDebug = process.env.DEBUG === 'true';

export function debugLog(...args) {
  if (isDebug) {
    console.log(...args);
  }
} 