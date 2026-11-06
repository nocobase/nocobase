import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useState, type ReactElement } from 'react';

import metadata from '../package.json' with { type: 'json' };

interface Entry {
  readonly id: string;
  readonly title: string;
}

type State =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly entries: readonly Entry[] }
  | { readonly status: 'error' };

export function ReadingList(): ReactElement {
  const api = useApiClient();
  // Public components may be rendered outside the plugin's own route subtree.
  const { t } = useTranslation(metadata.name);
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let current = true;
    api.request<{ data: Entry[] }>({ path: 'readingList', method: 'GET' }).then(
      (response) => {
        if (current) setState({ status: 'ready', entries: response.data });
      },
      () => {
        if (current) setState({ status: 'error' });
      },
    );
    return (): void => {
      current = false;
    };
  }, [api]);

  return (
    <section aria-label={t('title')}>
      <h2>{t('title')}</h2>
      {state.status === 'loading' ? <p role='status'>{t('loading')}</p> : null}
      {state.status === 'error' ? <p role='alert'>{t('failed')}</p> : null}
      {state.status === 'ready' ? (
        state.entries.length === 0 ? (
          <p>{t('empty')}</p>
        ) : (
          <ul>
            {state.entries.map((entry) => (
              <li key={entry.id}>{entry.title}</li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}
