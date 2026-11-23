import { useTranslation } from '@nocobase/i18n/client';
import { useCallback, useEffect, useState } from 'react';

import type {
  AuthorizationOptionsResponse,
  LocalizedText,
} from '../authorization-client.js';
import { useAuthorizationClient } from '../use-authorization-client.js';

export interface RuleSubject {
  readonly type: string;
  readonly id: string;
}

export const subjectKey = (subject: RuleSubject): string =>
  `${subject.type}:${subject.id}`;

export function useText(): (value: LocalizedText | undefined) => string {
  const { t } = useTranslation();
  return useCallback(
    (value) =>
      value === undefined
        ? ''
        : typeof value === 'string'
          ? value
          : t(value.key, {
              ns: value.ns,
              defaultValue: value.defaultValue ?? value.key,
            }),
    [t],
  );
}

/**
 * The display names of rule subjects, by `type:id`. A fixed subject, such as everyone, takes its type's title; a
 * directory subject is resolved through the rule surface's own directory. An unresolved one keeps its id.
 */
export function useSubjectTitles(
  path: string,
  subjects: readonly RuleSubject[],
  catalog: AuthorizationOptionsResponse | undefined,
): ReadonlyMap<string, string> {
  const authz = useAuthorizationClient();
  const text = useText();
  const [titles, setTitles] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const wanted = subjects.map(subjectKey).sort().join('\n');

  useEffect(() => {
    if (!catalog || !wanted) return;
    let active = true;
    const byType = new Map<string, string[]>();
    for (const line of wanted ? wanted.split('\n') : []) {
      const at = line.indexOf(':');
      const type = line.slice(0, at);
      const ids = byType.get(type) ?? [];
      ids.push(line.slice(at + 1));
      byType.set(type, ids);
    }
    void (async () => {
      const next = new Map<string, string>();
      await Promise.all(
        [...byType].map(async ([type, ids]) => {
          const option = catalog.subjectTypes.find(
            (candidate) => candidate.type === type,
          );
          if (!option) return;
          if (option.selection.type === 'fixed') {
            for (const id of ids)
              next.set(subjectKey({ type, id }), text(option.title));
            return;
          }
          for (let start = 0; start < ids.length; start += 100) {
            const found = await authz
              .resolveSubjects(path, type, ids.slice(start, start + 100))
              .catch(() => []);
            for (const item of found)
              next.set(subjectKey({ type, id: item.id }), text(item.title));
          }
        }),
      );
      if (active) setTitles(next);
    })();
    return () => {
      active = false;
    };
  }, [authz, catalog, path, text, wanted]);

  return titles;
}
