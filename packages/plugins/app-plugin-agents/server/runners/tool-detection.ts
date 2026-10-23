/** Best-effort refresh signals; offline runners always inspect on their next start. No heartbeat database writes. */
const pending = new Set<string>();
export function requestToolDetection(runnerId: string): void {
  pending.add(runnerId);
}
export function takeToolDetection(runnerId: string): boolean {
  return pending.delete(runnerId);
}
