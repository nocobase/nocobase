import type { Run } from '../../../shared/runs.js';

export function involvesRun(run: Run, userId: string): boolean {
  return run.actorUserId === userId || run.ownerUserId === userId;
}

/** Private subjects belong only to the people involved, regardless of global grants. */
export async function mayAccessRun(
  run: Run,
  userId: string,
  privateSubject: boolean,
  hasPermission: () => Promise<boolean>,
): Promise<boolean> {
  if (involvesRun(run, userId)) return true;
  return !privateSubject && (await hasPermission());
}
