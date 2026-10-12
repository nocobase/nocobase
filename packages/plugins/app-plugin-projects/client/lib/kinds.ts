/**
 * The kinds of principal the server knows (`shared/kinds.ts`, `GET /api/projects/me`): `user` and `system` built in, more
 * when another plugin registers them. Pages render actors, executors and mentions from this list rather than a fixed
 * set; a kind the list lacks still shows, by its key.
 */
import { useTranslation } from '@nocobase/i18n/client';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { useQuery } from '@tanstack/react-query';

import { SYSTEM_KIND, USER_KIND, type KindInfo } from '../../shared/kinds.js';
import { pmKeys } from '../api/keys.js';
import type { ExecutorOption } from '../components/pm-executor-select.js';
import { usePmApi } from '../hooks/use-pm-api.js';
import { useViewer } from '../hooks/use-viewer.js';
import { isBuiltInKind } from './kind-order.js';
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

/** A kind's name: the built-in ones from this plugin's locale (`actor.*`), the others from their registered title. */
export function useKindLabel(): (key: string) => string {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const kinds = useKinds();
  return (key) => {
    if (isBuiltInKind(key)) return t(`actor.${key}`);
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
      ...(candidate.isDefault ? { isDefault: true } : {}),
    };
  });
}
