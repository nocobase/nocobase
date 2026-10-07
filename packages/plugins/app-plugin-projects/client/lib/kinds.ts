/**
 * The kinds of principal the server knows (`shared/kinds.ts`, `GET /api/projects/me`): `user` and `system` built in, more
 * when another plugin registers them. Pages render actors, executors and mentions from this list rather than a fixed
 * set; a kind the list lacks still shows, by its key.
 */
import { useTranslation } from '@nocobase/i18n/client';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { useQuery } from '@tanstack/react-query';

import type { Executor, StatusDefinition } from '../../shared/issues.js';
import { BACKLOG_STATUS } from '../../shared/workflows.js';
import { SYSTEM_KIND, USER_KIND, type KindInfo } from '../../shared/kinds.js';
import { pmKeys } from '../api/keys.js';
import type { ExecutorOption } from '../components/pm-executor-select.js';
import { usePmApi } from '../hooks/use-pm-api.js';
import { useViewer } from '../hooks/use-viewer.js';
import { isBuiltInKind, orderKinds } from './kind-order.js';
import { usePrincipalName } from './principal-name.js';

export { isBuiltInKind, orderKinds } from './kind-order.js';

const BUILT_IN: readonly KindInfo[] = [
  { key: USER_KIND, title: null, executor: true, mentionable: true },
  { key: SYSTEM_KIND, title: null, executor: false, mentionable: false },
];

/** The registered kinds, built-in ones first; the built-in two until the viewer has loaded. */
export function useKinds(): readonly KindInfo[] {
  return useViewer()?.kinds ?? BUILT_IN;
}

/** The kinds a workflow transition may name, in display order. */
export function useActorKinds(): readonly string[] {
  return orderKinds(useKinds().map((kind) => kind.key));
}

/**
 * A kind's name: the built-in ones from this plugin's locale (`actor.*`, or `workflows.actors.*` where a workflow
 * names who may move an issue), the others from their registered title.
 */
export function useKindLabel(
  scope: 'actor' | 'workflows.actors' = 'actor',
): (key: string) => string {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const kinds = useKinds();
  return (key) => {
    if (isBuiltInKind(key)) return t(`${scope}.${key}`);
    const title = kinds.find((kind) => kind.key === key)?.title;
    if (!title) return key;
    return typeof title === 'string'
      ? title
      : t(title.key, { ns: title.ns, defaultValue: key });
  };
}

/**
 * The executors of other kinds the viewer may give work to (agents, when the agents plugin registers them), for
 * `PmExecutorSelect`'s `others`: each with a note when nothing can run its work now, or how much it is doing.
 */
export function useExecutorOptions(): readonly ExecutorOption[] {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const nameOf = usePrincipalName();
  const api = usePmApi();
  const hasOthers = useKinds().some(
    (kind) => kind.executor && !isBuiltInKind(kind.key),
  );
  const candidates = useQuery({
    queryKey: pmKeys.executors,
    queryFn: () => api.executors(),
    enabled: hasOthers,
    staleTime: 30_000,
  });
  return (candidates.data ?? []).map((candidate) => {
    const note =
      candidate.online === false
        ? t('executor.offline')
        : candidate.busy
          ? t('executor.busy', { count: candidate.busy })
          : undefined;
    return {
      type: candidate.type,
      id: candidate.id,
      name: nameOf(candidate),
      ...(note ? { note } : {}),
    };
  });
}

/** Where work does not start: backlog, and a finished status (done or closed); `statuses` gives the categories. */
export function isDormantStatus(
  key: string,
  statuses: readonly StatusDefinition[] = [],
): boolean {
  if (key === BACKLOG_STATUS) return true;
  const category = statuses.find((status) => status.key === key)?.category;
  return category === 'done' || category === 'closed';
}

export interface StartCheck {
  /** The status before the change; null for an issue being created. */
  readonly fromStatus: string | null;
  /** The status after the change; left out when the status does not change. */
  readonly toStatus?: string;
  readonly executorBefore: Executor | null;
  /** The executor after the change; left out when the executor does not change. */
  readonly executorAfter?: Executor | null;
  /** The issue's workflow, for the categories of its statuses. */
  readonly statuses?: readonly StatusDefinition[];
}

/**
 * The executor of another kind (an agent) a change would start working, which asks "Start now?" first, as the old
 * NocoProject's `needsStartConfirmation`; null when it starts nobody. That is such an executor newly set (or set on a
 * new issue) while the issue is in a status where work starts, or the issue moved out of backlog into one while such an
 * executor works on it. Nothing starts in backlog or a finished status, so a change landing there asks nothing.
 */
export function startingExecutor({
  fromStatus,
  toStatus,
  executorBefore,
  executorAfter,
  statuses,
}: StartCheck): Executor | null {
  const executor = executorAfter === undefined ? executorBefore : executorAfter;
  const status = toStatus ?? fromStatus;
  if (!executor || isBuiltInKind(executor.type) || status === null) return null;
  if (isDormantStatus(status, statuses)) return null;
  const changed =
    executorAfter !== undefined &&
    !(
      executorBefore &&
      executorBefore.type === executor.type &&
      executorBefore.id === executor.id
    );
  if (changed || fromStatus === null) return executor;
  return toStatus !== undefined &&
    toStatus !== fromStatus &&
    fromStatus === BACKLOG_STATUS
    ? executor
    : null;
}
