import { useTranslation } from '@nocobase/i18n/client';
import { ArrowRightIcon } from 'lucide-react';
import {
  type ReactElement,
  type ReactNode,
  type RefObject,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { StatusCategory } from '../../../../shared/issues.js';
import {
  ANY_STATUS,
  STATUS_CATEGORIES,
  type WorkflowDefinition,
  type WorkflowStatus,
} from '../../../../shared/workflows.js';
import { PmTag } from '../../../components/pm-tag.js';
import { cn } from 'cn';
import {
  CATEGORY_NODE_CLASS,
  eventEdges,
  explicitEdges,
  reachableFrom,
  statusesByCategory,
  wildcardMoves,
  type WorkflowEdge,
} from './workflow-model.js';
import { useStatusName } from './use-status-name.js';
import { ActorIcons } from './workflow-views.js';
import { isBuiltInKind, orderKinds, useKindLabel } from '../../../lib/kinds.js';

/**
 * The status card's picture: four category columns (unstarted → started → done, closed apart on the right), each
 * stacking its statuses in board order, with the transitions set for two concrete statuses drawn as arrows between
 * them. Entries with "any status" on an end are stated in a line above instead of drawn, since they join everything.
 * Pointing at a status shows everywhere it can go, wildcards included.
 */

/** Unstarted, started and done follow one another; closed stands apart. */
const PROGRESSION: readonly StatusCategory[] = ['unstarted', 'started', 'done'];

interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

type Side = 'left' | 'right';

interface Placed {
  readonly edge: WorkflowEdge;
  readonly path: string;
  readonly label: { readonly x: number; readonly y: number };
}

const column = (status: WorkflowStatus): number =>
  STATUS_CATEGORIES.indexOf(status.category);

/**
 * Routes every edge from the measured node boxes. Within a column an edge arcs out beside the column (downward moves
 * on the right, upward on the left, wider for longer spans); between columns it leaves the side facing the target.
 * Ends sharing a node side are spread along it, ordered by where their other end is, so they do not meet.
 */
function route(
  edges: readonly WorkflowEdge[],
  states: readonly WorkflowStatus[],
  boxes: ReadonlyMap<string, Box>,
): Placed[] {
  const status = new Map(states.map((state) => [state.key, state]));
  const rows = new Map<string, number>();
  for (const category of STATUS_CATEGORIES)
    states
      .filter((state) => state.category === category)
      .forEach((state, index) => rows.set(state.key, index));
  const centre = (key: string): number => {
    const box = boxes.get(key);
    return box ? box.y + box.h / 2 : 0;
  };

  const plans = edges.map((edge) => {
    const from = status.get(edge.from)!;
    const to = status.get(edge.to)!;
    const sameColumn = column(from) === column(to);
    const down = (rows.get(edge.to) ?? 0) > (rows.get(edge.from) ?? 0);
    const forward = column(to) > column(from);
    const fromSide: Side = sameColumn
      ? down
        ? 'right'
        : 'left'
      : forward
        ? 'right'
        : 'left';
    const toSide: Side = sameColumn ? fromSide : forward ? 'left' : 'right';
    return { edge, sameColumn, fromSide, toSide };
  });

  // Ends per node side, spread along the side in the order of the other end's height.
  const ends = new Map<string, { plan: number; end: 'from' | 'to' }[]>();
  plans.forEach((plan, index) => {
    for (const end of ['from', 'to'] as const) {
      const key = `${plan.edge[end]}:${end === 'from' ? plan.fromSide : plan.toSide}`;
      ends.set(key, [...(ends.get(key) ?? []), { plan: index, end }]);
    }
  });
  const offset = new Map<string, number>();
  for (const [key, list] of ends) {
    const node = key.slice(0, key.lastIndexOf(':'));
    const box = boxes.get(node);
    const room = box ? Math.max(0, box.h - 12) : 0;
    const step = list.length > 1 ? Math.min(7, room / (list.length - 1)) : 0;
    [...list]
      .sort((a, b) => {
        const other = (entry: (typeof list)[number]) =>
          centre(
            entry.end === 'from'
              ? plans[entry.plan].edge.to
              : plans[entry.plan].edge.from,
          );
        return other(a) - other(b);
      })
      .forEach((entry, index) =>
        offset.set(
          `${entry.plan}:${entry.end}`,
          (index - (list.length - 1) / 2) * step,
        ),
      );
  }

  return plans.map((plan, index) => {
    const a = boxes.get(plan.edge.from) ?? { x: 0, y: 0, w: 0, h: 0 };
    const b = boxes.get(plan.edge.to) ?? { x: 0, y: 0, w: 0, h: 0 };
    const sx = plan.fromSide === 'right' ? a.x + a.w : a.x;
    const sy = a.y + a.h / 2 + (offset.get(`${index}:from`) ?? 0);
    const ex = plan.toSide === 'right' ? b.x + b.w : b.x;
    const ey = b.y + b.h / 2 + (offset.get(`${index}:to`) ?? 0);
    if (plan.sameColumn) {
      const span = Math.abs(
        (rows.get(plan.edge.to) ?? 0) - (rows.get(plan.edge.from) ?? 0),
      );
      const bulge = Math.min(96, 30 + 18 * (span - 1));
      const out = plan.fromSide === 'right' ? bulge : -bulge;
      return {
        edge: plan.edge,
        path: `M${sx},${sy} C${sx + out},${sy} ${ex + out},${ey} ${ex},${ey}`,
        label: { x: sx + out * 0.75, y: (sy + ey) / 2 },
      };
    }
    const dx = (ex - sx) / 2;
    return {
      edge: plan.edge,
      path: `M${sx},${sy} C${sx + dx},${sy} ${ex - dx},${ey} ${ex},${ey}`,
      label: { x: (sx + ex) / 2, y: (sy + ey) / 2 },
    };
  });
}

type Tone = 'approval' | 'selected' | 'other' | 'system' | 'people';

/**
 * How an edge is drawn: approvals amber, the selected status's moves in the primary colour, else by who may move: a
 * kind other than people and the system (`lib/kinds.ts`) in blue, the system dashed, people only grey.
 */
function toneOf(edge: WorkflowEdge, selected: boolean): Tone {
  if (edge.approval) return 'approval';
  if (selected) return 'selected';
  if (edge.actors.some((actor) => !isBuiltInKind(actor))) return 'other';
  if (edge.actors.includes('system')) return 'system';
  return 'people';
}

const TONE_STROKE: Readonly<Record<Tone, string>> = {
  approval: 'stroke-amber-500',
  selected: 'stroke-primary',
  other: 'stroke-sky-600 dark:stroke-sky-400',
  system: 'stroke-muted-foreground',
  people: 'stroke-muted-foreground',
};

const TONE_FILL: Readonly<Record<Tone, string>> = {
  approval: 'fill-amber-500',
  selected: 'fill-primary',
  other: 'fill-sky-600 dark:fill-sky-400',
  system: 'fill-muted-foreground',
  people: 'fill-muted-foreground',
};

const TONES: readonly Tone[] = [
  'approval',
  'selected',
  'other',
  'system',
  'people',
];

/** What the line styles mean, under the diagram. */
function Legend({
  others,
}: {
  /** The other kinds the drawn edges name, already labelled. */
  readonly others: readonly string[];
}): ReactElement {
  const { t } = useTranslation();
  const sample = (tone: Tone, dashed = false): ReactElement => (
    <svg aria-hidden='true' width='24' height='8' className='shrink-0'>
      <line
        x1='0'
        y1='4'
        x2='24'
        y2='4'
        strokeWidth='1.5'
        strokeDasharray={dashed ? '4 3' : undefined}
        className={TONE_STROKE[tone]}
      />
    </svg>
  );
  return (
    <ul className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
      {others.length > 0 ? (
        <li className='inline-flex items-center gap-1.5'>
          {sample('other')}
          {t('workflows.legendKinds', {
            names: others.join(t('workflows.listSeparator')),
          })}
        </li>
      ) : null}
      <li className='inline-flex items-center gap-1.5'>
        {sample('system', true)}
        {t('workflows.legendSystem')}
      </li>
      <li className='inline-flex items-center gap-1.5'>
        {sample('people')}
        {t('workflows.legendPeople')}
      </li>
      <li className='inline-flex items-center gap-1.5'>
        {sample('approval')}
        {t('workflows.legendApproval')}
      </li>
    </ul>
  );
}

/** The node boxes relative to the diagram, measured after layout and again whenever the diagram resizes. */
function useBoxes(
  container: RefObject<HTMLDivElement | null>,
  version: string,
): ReadonlyMap<string, Box> {
  const [boxes, setBoxes] = useState<ReadonlyMap<string, Box>>(() => new Map());
  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return undefined;
    const measure = (): void => {
      const origin = element.getBoundingClientRect();
      const next = new Map<string, Box>();
      for (const node of element.querySelectorAll<HTMLElement>('[data-node]')) {
        const rect = node.getBoundingClientRect();
        next.set(node.dataset.node ?? '', {
          x: rect.left - origin.left,
          y: rect.top - origin.top,
          w: rect.width,
          h: rect.height,
        });
      }
      setBoxes(next);
    };
    // After the frame the nodes are laid out in; a resize measures again.
    const frame = requestAnimationFrame(measure);
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measure);
    observer?.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [container, version]);
  return boxes;
}

/** "People: between any statuses", "System: any status → Done": the entries the diagram does not draw. */
function WildcardLines({
  definition,
}: {
  readonly definition: WorkflowDefinition;
}): ReactElement | null {
  const { t } = useTranslation();
  const name = useStatusName(definition);
  const kindLabel = useKindLabel('workflows.actors');
  const lines = wildcardMoves(definition);
  if (lines.length === 0) return null;
  const separator = t('workflows.listSeparator');
  return (
    <ul aria-label={t('workflows.wildcardTitle')} className='space-y-1 text-sm'>
      {lines.map(({ actor, moves }) => (
        <li key={actor} className='flex flex-wrap items-center gap-2'>
          <ActorIcons actors={[actor]} />
          <span>
            {t('workflows.wildcardLine', {
              actor: kindLabel(actor),
              moves: moves
                .map((move) =>
                  move.from === ANY_STATUS && move.to === ANY_STATUS
                    ? t('workflows.anyToAny')
                    : t('workflows.moveText', {
                        from: name(move.from),
                        to: name(move.to),
                      }) +
                      (move.approval
                        ? t('workflows.moveNeedsApproval', {
                            roles: move.approval
                              .map((role) => t(`workflows.approvers.${role}`))
                              .join(separator),
                          })
                        : ''),
                )
                .join(t('workflows.moveSeparator')),
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Under the diagram: where the status pointed at can go, and who may move it there. */
function Reachable({
  definition,
  shown,
}: {
  readonly definition: WorkflowDefinition;
  readonly shown: string | null;
}): ReactElement {
  const { t } = useTranslation();
  const name = useStatusName(definition);
  const separator = t('workflows.listSeparator');
  const cells = shown ? reachableFrom(definition, shown) : [];
  return (
    <div
      aria-live='polite'
      className='min-h-9 rounded-lg border bg-muted/30 px-3 py-2 text-sm'
    >
      {!shown ? (
        <span className='text-muted-foreground'>
          {t('workflows.reachableHint')}
        </span>
      ) : cells.length === 0 ? (
        <span>{t('workflows.reachableNone', { name: name(shown) })}</span>
      ) : (
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1.5'>
          <span className='font-medium'>
            {t('workflows.reachableTitle', { name: name(shown) })}
          </span>
          {cells.map((cell) => (
            <span
              key={cell.to}
              data-reachable={cell.to}
              className='inline-flex items-center gap-1.5'
            >
              {name(cell.to)}
              <span className='text-muted-foreground'>
                <ActorIcons actors={cell.actors} />
              </span>
              {cell.approval ? (
                <PmTag tone='amber'>
                  {t('workflows.approvalBy', {
                    roles: cell.approval
                      .map((role) => t(`workflows.approvers.${role}`))
                      .join(separator),
                  })}
                </PmTag>
              ) : null}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** A status as the read-only diagram shows it: a button that, when pressed, keeps its moves shown. */
function StatusNode({
  status,
  name,
  pressed,
  onPress,
}: {
  readonly status: WorkflowStatus;
  readonly name: string;
  readonly pressed: boolean;
  readonly onPress: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <button
      type='button'
      aria-pressed={pressed}
      title={name}
      data-category={status.category}
      onClick={onPress}
      className={cn(
        'flex h-8 w-full items-center justify-center rounded-lg border px-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        CATEGORY_NODE_CLASS[status.category],
      )}
    >
      <span className='truncate'>{name}</span>
      <span className='sr-only'>
        {`(${t(`workflows.categories.${status.category}.title`)})`}
      </span>
    </button>
  );
}

/**
 * The diagram. With `renderStatus` (edit mode) each status is whatever it renders, usually a button opening an editor,
 * and `renderAdd` closes each column; without it a status is a button that pins its moves.
 */
export function WorkflowDiagram({
  definition,
  renderStatus,
  renderAdd,
}: {
  readonly definition: WorkflowDefinition;
  readonly renderStatus?: (status: WorkflowStatus) => ReactElement;
  readonly renderAdd?: (category: StatusCategory) => ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const name = useStatusName(definition);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const known = new Set(definition.states.map((state) => state.key));
  const shown =
    (hovered && known.has(hovered) ? hovered : null) ??
    (pinned && known.has(pinned) ? pinned : null);
  const columns = statusesByCategory(definition);
  const kindLabel = useKindLabel('workflows.actors');
  // Moves the system makes on an event are drawn dashed, as system moves, unless the pair is drawn already.
  const edges = useMemo(() => {
    const drawn = explicitEdges(definition);
    const pairs = new Set(drawn.map((edge) => `${edge.from}>${edge.to}`));
    return [
      ...drawn,
      ...eventEdges(definition)
        .filter((edge) => !pairs.has(`${edge.from}>${edge.to}`))
        .map((edge) => ({
          from: edge.from,
          to: edge.to,
          actors: ['system'] as const,
          approval: null,
        })),
    ];
  }, [definition]);
  const layout = definition.states
    .map((state) => `${state.key}:${state.category}:${state.name}`)
    .join('|');
  const boxes = useBoxes(containerRef, layout);
  const placed = route(edges, definition.states, boxes);
  const reachable = new Set(
    shown ? reachableFrom(definition, shown).map((cell) => cell.to) : [],
  );
  const size = { w: 0, h: 0 };
  for (const box of boxes.values()) {
    size.w = Math.max(size.w, box.x + box.w + 80);
    size.h = Math.max(size.h, box.y + box.h + 16);
  }

  const column = (category: StatusCategory): ReactElement => {
    const statuses =
      columns.find((entry) => entry.category === category)?.statuses ?? [];
    return (
      <div key={category} className='flex min-w-0 flex-col items-center gap-6'>
        <ul
          aria-label={t(`workflows.categories.${category}.title`)}
          className='flex w-full max-w-36 flex-col gap-6'
        >
          {statuses.map((status) => {
            const state =
              shown === null
                ? 'idle'
                : status.key === shown
                  ? 'source'
                  : reachable.has(status.key)
                    ? 'target'
                    : 'other';
            return (
              <li
                key={status.key}
                data-node={status.key}
                data-state={state}
                onMouseEnter={() => setHovered(status.key)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(status.key)}
                onBlur={() => setHovered(null)}
                className={cn(
                  'relative rounded-lg transition-opacity',
                  state === 'source' && 'ring-2 ring-primary ring-offset-2',
                  state === 'target' && 'ring-1 ring-primary/60',
                  state === 'other' && 'opacity-35',
                )}
              >
                {renderStatus ? (
                  renderStatus(status)
                ) : (
                  <StatusNode
                    status={status}
                    name={name(status.key)}
                    pressed={pinned === status.key}
                    onPress={() =>
                      setPinned((current) =>
                        current === status.key ? null : status.key,
                      )
                    }
                  />
                )}
              </li>
            );
          })}
        </ul>
        {renderAdd ? renderAdd(category) : null}
      </div>
    );
  };

  return (
    <div className='space-y-4'>
      <WildcardLines definition={definition} />
      <div className='overflow-x-auto'>
        <div className='min-w-[44rem] space-y-3'>
          <div
            aria-hidden='true'
            className='grid grid-cols-[1fr_1fr_1fr_auto_1fr] items-center gap-x-12 text-xs font-medium text-muted-foreground'
          >
            {PROGRESSION.map((category, index) => (
              <div
                key={category}
                className='relative flex items-center justify-center gap-1.5'
              >
                <span
                  className={cn(
                    'size-2.5 rounded-sm border',
                    CATEGORY_NODE_CLASS[category],
                  )}
                />
                {t(`workflows.categories.${category}.title`)}
                {index < PROGRESSION.length - 1 ? (
                  <ArrowRightIcon className='absolute -right-8 size-4' />
                ) : null}
              </div>
            ))}
            <span />
            <div className='flex items-center justify-center gap-1.5'>
              <span
                className={cn(
                  'size-2.5 rounded-sm border',
                  CATEGORY_NODE_CLASS.closed,
                )}
              />
              {t('workflows.categories.closed.title')}
            </div>
          </div>
          <div
            ref={containerRef}
            className='relative grid grid-cols-[1fr_1fr_1fr_auto_1fr] gap-x-12 py-2'
          >
            {PROGRESSION.map(column)}
            <div aria-hidden='true' className='w-px self-stretch bg-border' />
            {column('closed')}
            <svg
              aria-hidden='true'
              className='pointer-events-none absolute top-0 left-0 overflow-visible'
              width={size.w}
              height={size.h}
            >
              <defs>
                {TONES.map((tone) => (
                  <marker
                    key={tone}
                    id={`pm-workflow-arrow-${tone}`}
                    viewBox='0 0 8 8'
                    refX='7'
                    refY='4'
                    markerWidth='6'
                    markerHeight='6'
                    orient='auto-start-reverse'
                  >
                    <path d='M0,0 L8,4 L0,8 z' className={TONE_FILL[tone]} />
                  </marker>
                ))}
              </defs>
              {placed.map(({ edge, path }) => {
                const selected = shown !== null && edge.from === shown;
                const tone = toneOf(edge, selected);
                return (
                  <path
                    key={`${edge.from}>${edge.to}`}
                    data-edge={`${edge.from}>${edge.to}`}
                    data-tone={tone}
                    d={path}
                    fill='none'
                    strokeWidth={selected ? 2 : 1.5}
                    strokeDasharray={tone === 'system' ? '4 3' : undefined}
                    markerEnd={`url(#pm-workflow-arrow-${tone})`}
                    className={cn(
                      'transition-opacity',
                      TONE_STROKE[tone],
                      shown === null || selected ? 'opacity-90' : 'opacity-10',
                    )}
                  />
                );
              })}
            </svg>
            <div
              aria-hidden='true'
              className='pointer-events-none absolute top-0 left-0'
            >
              {placed
                .filter(
                  ({ edge }) =>
                    (shown !== null && edge.from === shown) ||
                    (edge.approval !== null && shown === null),
                )
                .map(({ edge, label }) => (
                  <span
                    key={`${edge.from}>${edge.to}`}
                    data-edge-label={`${edge.from}>${edge.to}`}
                    style={{ left: label.x, top: label.y }}
                    className={cn(
                      'absolute flex -translate-1/2 items-center gap-1 rounded-full border bg-background px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground shadow-xs',
                      edge.approval && 'border-amber-400 text-amber-700',
                    )}
                  >
                    <ActorIcons actors={edge.actors} />
                    {edge.approval ? t('workflows.approval') : null}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>
      <Legend
        others={orderKinds(edges.flatMap((edge) => edge.actors))
          .filter((actor) => !isBuiltInKind(actor))
          .map(kindLabel)}
      />
      <Reachable definition={definition} shown={shown} />
      <p className='sr-only'>{t('workflows.diagramTextHint')}</p>
    </div>
  );
}

/** The list's cards: each category's statuses as a column of small chips, without transitions. */
export function WorkflowColumns({
  definition,
}: {
  readonly definition: Pick<WorkflowDefinition, 'states'>;
}): ReactElement {
  const { t } = useTranslation();
  const name = useStatusName(definition);
  return (
    <div className='grid grid-cols-4 gap-3'>
      {STATUS_CATEGORIES.map((category) => (
        <div key={category} className='min-w-0 space-y-1.5'>
          <p className='text-xs text-muted-foreground'>
            {t(`workflows.categories.${category}.title`)}
          </p>
          <ul
            aria-label={t(`workflows.categories.${category}.title`)}
            className='flex flex-col items-start gap-1'
          >
            {definition.states
              .filter((status) => status.category === category)
              .map((status) => (
                <li
                  key={status.key}
                  data-category={status.category}
                  className={cn(
                    'max-w-full truncate rounded-md border px-2 py-0.5 text-xs font-medium',
                    CATEGORY_NODE_CLASS[status.category],
                  )}
                >
                  {name(status.key)}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
