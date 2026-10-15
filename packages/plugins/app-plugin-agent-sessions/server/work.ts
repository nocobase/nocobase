/**
 * What a session's agent is told about the work tied to the session: the records created in it or mentioned in its
 * messages, how each stands, and what changed since it was last told.
 */

/** One record tied to a session, as its agent reads it; its standing in the owner's language. */
export interface WorkItem {
  readonly kind: string;
  readonly refId: string;
  readonly key: string | null;
  readonly title: string;
  readonly status: string | null;
  readonly group: string | null;
}

/** Each record's standing as the agent was told it, by `kind:refId`. */
export type WorkSnapshot = Readonly<Record<string, string>>;

const HEADING =
  'Work tied to this session, which the person means by "the tasks" or "the work" unless they name others:';

export function workSnapshot(items: readonly WorkItem[]): WorkSnapshot {
  return Object.fromEntries(
    items.map((item) => [idOf(item), item.status ?? '']),
  );
}

/**
 * The work, for the agent to read before a message: all of it, with what is new or changed since `told` marked;
 * undefined when there is none, or nothing changed since it was told.
 */
export function workNote(
  items: readonly WorkItem[],
  told: WorkSnapshot | null,
): string | undefined {
  if (items.length === 0) return undefined;
  const snapshot = workSnapshot(items);
  if (
    told &&
    Object.keys(told).length === items.length &&
    items.every((item) => told[idOf(item)] === snapshot[idOf(item)])
  )
    return undefined;
  const lines = items.map((item) => {
    const before = told?.[idOf(item)];
    const change = !told
      ? ''
      : before === undefined
        ? ' (new)'
        : before !== snapshot[idOf(item)]
          ? ` (was ${before || 'unknown'})`
          : '';
    return `- ${workName(item)}${item.status ? `: ${item.status}` : ''}${change}`;
  });
  return `${HEADING}\n${lines.join('\n')}`;
}

/** `#ST-58 Title`, or the title of a record without a key. */
export function workName(item: Pick<WorkItem, 'key' | 'title'>): string {
  return item.key ? `#${item.key} ${item.title}` : item.title;
}

function idOf(item: Pick<WorkItem, 'kind' | 'refId'>): string {
  return `${item.kind}:${item.refId}`;
}
