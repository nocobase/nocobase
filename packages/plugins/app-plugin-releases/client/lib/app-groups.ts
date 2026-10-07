/**
 * App IDs said briefly: pull request previews named by the `<app>-pr-<number>` convention fold into one group
 * (`crm-pr-*` ×3) so twenty previews do not flood a row, and at most a few entries are shown, the rest counted.
 */

export interface AppGroup {
  /** An App's ID, or a group's pattern (`crm-pr-*`). */
  readonly label: string;
  /** The Apps it stands for, by ID. */
  readonly ids: readonly string[];
}

export interface CompactApps {
  readonly shown: readonly AppGroup[];
  /** How many groups were left out. */
  readonly more: number;
}

const PREVIEW_ID = /^(.+)-pr-\d+$/u;

/** The IDs grouped: previews of the same App together (two or more), every other ID on its own, in first-seen order. */
export function groupAppIds(ids: readonly string[]): AppGroup[] {
  const groups: { label: string; ids: string[] }[] = [];
  const byPrefix = new Map<string, { label: string; ids: string[] }>();
  for (const id of ids) {
    const prefix = PREVIEW_ID.exec(id)?.[1];
    if (prefix === undefined) {
      groups.push({ label: id, ids: [id] });
      continue;
    }
    const existing = byPrefix.get(prefix);
    if (existing) existing.ids.push(id);
    else {
      const group = { label: `${prefix}-pr-*`, ids: [id] };
      byPrefix.set(prefix, group);
      groups.push(group);
    }
  }
  // A single preview is shown by its own ID.
  return groups.map((group) =>
    group.ids.length === 1 ? { label: group.ids[0], ids: group.ids } : group,
  );
}

/** At most `max` groups, and how many more there are. */
export function compactAppIds(
  ids: readonly string[],
  max: number = 3,
): CompactApps {
  const groups = groupAppIds(ids);
  return {
    shown: groups.slice(0, max),
    more: Math.max(0, groups.length - max),
  };
}
