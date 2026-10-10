import {
  contextChips,
  buildPageContext,
  type ChatContextInput,
  type ChatContextChip,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  PageContextRef,
  PageContext,
} from '@nocobase/app-plugin-agents/shared/conversations';

const FILTERS = new Set([
  'statusKey',
  'ownerUserId',
  'labelId',
  'assigneeId',
  'tab',
  'status',
  'priority',
  'ownerId',
  'projectId',
  'agentId',
  'archived',
  'doc',
  'type',
  'q',
]);
function routeObject(path: string): PageContextRef | null {
  if (/\/plans\/[^/]+/u.test(path)) return null;
  const run = path.match(/\/runs\/([^/]+)/u);
  if (run) return { kind: 'run', id: run[1] ?? '' };
  const issue = path.match(/\/(?:issues|my-issues\/[^/]+)\/([^/]+)/u);
  if (
    issue &&
    !['new', 'new-issue', 'intake', 'plans'].includes(issue[1] ?? '')
  )
    return { kind: 'issue', id: issue[1] ?? '' };
  for (const [segment, kind] of [
    ['projects', 'project'],
    ['inbox', 'inboxItem'],
    ['agents', 'agent'],
    ['runs', 'run'],
  ] as const) {
    const match = path.match(new RegExp(`/${segment}/([^/]+)`));
    if (match && !['new', 'usage', 'settings'].includes(match[1] ?? ''))
      return { kind, id: match[1] ?? '' };
  }
  return null;
}

/** A bounded location snapshot; no DOM scraping, form values or unrestricted query string. */
export function studioContext(
  input: ChatContextInput,
  pageName: string,
): {
  context: PageContext;
  chips: readonly ChatContextChip[];
  truncated: boolean;
} {
  const url = new URL(input.route, 'http://studio.local');
  const routeRef = routeObject(url.pathname);
  const resolved =
    routeRef &&
    input.sources.find(
      (item) =>
        item.kind === routeRef.kind &&
        (item.id === routeRef.id ||
          (routeRef.kind === 'issue' &&
            item.label.startsWith(`${routeRef.id} `))),
    );
  const object =
    resolved ??
    (routeRef
      ? { ...routeRef, label: `${routeRef.kind}:${routeRef.id}` }
      : null);
  const positionOnly =
    /\/plans\/[^/]+/u.test(url.pathname) || url.searchParams.has('doc');
  const automatic = positionOnly
    ? []
    : object
      ? [
          object,
          ...input.sources.filter(
            (item) => item.kind === 'project' && object.kind === 'issue',
          ),
        ].slice(0, 2)
      : input.sources.slice(-2);
  const params: Record<string, string> = {};
  // Details suppress filters from the list covered by the detail page.
  const entries =
    object && !positionOnly
      ? [...url.searchParams].filter(([key]) => key === 'tab')
      : [...Object.entries(input.filter?.params ?? {}), ...url.searchParams];
  for (const [key, value] of entries)
    if (FILTERS.has(key) && Object.keys(params).length < 8)
      params[key] = value.slice(0, 120);
  const normalized: ChatContextInput = {
    ...input,
    route: input.removed.has('filter') ? '' : url.pathname.slice(0, 300),
    sources: automatic,
    filter: {
      page: pageName.slice(0, 80),
      params: {
        page: pageName.slice(0, 80),
        ...Object.fromEntries(Object.entries(params).slice(0, 7)),
      },
    },
    selection: input.selection
      ? { text: input.selection.text.slice(0, 800) }
      : null,
  };
  const chips = contextChips(normalized).slice(0);
  const built = buildPageContext(normalized) ?? { route: '', items: [] };
  let context = { ...built, items: built.items.slice(0, 4) };
  const original = JSON.stringify(context);
  // Remove low-priority automatic references, then filters, then selected text.
  while (
    JSON.stringify(context).length > 2400 &&
    context.items.length > input.pinned.length
  )
    context = { ...context, items: context.items.slice(0, -1) };
  if (JSON.stringify(context).length > 2400 && context.filter)
    context = {
      ...context,
      filter: { ...context.filter, params: { page: pageName.slice(0, 80) } },
    };
  while (
    JSON.stringify(context).length > 2400 &&
    context.selection?.text.length
  )
    context = {
      ...context,
      selection: { text: context.selection.text.slice(0, -1) },
    };
  while (JSON.stringify(context).length > 2400 && context.items.length)
    context = { ...context, items: context.items.slice(0, -1) };
  while (JSON.stringify(context).length > 2400 && context.route.length)
    context = { ...context, route: context.route.slice(0, -1) };
  const finalChips = chips
    .filter(
      (chip) =>
        chip.kind !== 'item' ||
        context.items.some(
          (item) => item.kind === chip.item.kind && item.id === chip.item.id,
        ),
    )
    .map((chip) =>
      chip.kind === 'filter' && context.filter
        ? { ...chip, filter: context.filter }
        : chip.kind === 'selection' && context.selection
          ? { ...chip, selection: context.selection }
          : chip,
    );
  return {
    context,
    chips: finalChips,
    truncated:
      original !== JSON.stringify(context) ||
      pageName.length > 80 ||
      url.pathname.length > 300 ||
      (input.selection?.text.length ?? 0) > 800 ||
      input.sources.length > automatic.length,
  };
}
