/** Joins class names, skipping falsy values. */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Key of a game's settings on one brand in the flat `states` map. */
export const stateKey = (gameId: string, brandId: string) => `${gameId}|${brandId}`;
