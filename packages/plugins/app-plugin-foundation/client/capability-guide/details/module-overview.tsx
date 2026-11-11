import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import {
  CurrentApplication,
  ConfigurationItem,
  InterfaceItem,
  ConfigurationActions,
  ConfigurationAction,
} from './detail-layout.js';
import type {
  ModuleOverview as Overview,
  ModuleText,
} from './module-overview-types.js';

/** Configuration prototypes never substitute defaults for unavailable runtime evidence. */
export function ModuleOverview({
  definition,
}: {
  readonly definition: Overview;
}): ReactElement {
  const { i18n } = useTranslation();
  const text = (value: ModuleText): string =>
    value[i18n.language.startsWith('zh') ? 1 : 0];
  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <CurrentApplication
        footer={
          definition.configurations?.length || definition.note ? (
            <>
              {definition.configurations?.length ? (
                <p>
                  {text([
                    'Current configuration is not available yet.',
                    '暂时无法获取当前配置。',
                  ])}
                </p>
              ) : null}
              {definition.note ? <p>{text(definition.note)}</p> : null}
            </>
          ) : undefined
        }
      >
        {definition.configurations?.map((group) => (
          <section
            key={group.title[0]}
            className='py-5'
            aria-label={text(group.title)}
          >
            <h4 className='mb-3 text-sm font-semibold'>{text(group.title)}</h4>
            <dl className='divide-y rounded-lg border bg-muted/20 px-3'>
              {group.fields.map((field) => (
                <div
                  key={field[0]}
                  className='flex flex-wrap items-start justify-between gap-x-6 gap-y-1 py-3 text-sm'
                >
                  <dt className='text-muted-foreground'>{text(field)}</dt>
                  <dd>{text(['Not available yet', '待获取'])}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        {definition.evidence?.map((item) => (
          <ConfigurationItem
            key={item.title[0]}
            title={text(item.title)}
            description={text(item.description)}
          />
        ))}
        {definition.interfaces?.map((item) => (
          <InterfaceItem
            key={item.title[0]}
            names={item.names}
            paths={item.paths}
            missingState={item.knownRoute ? 'unconfigured' : 'unknown'}
            title={text(item.title)}
            description={item.description ? text(item.description) : undefined}
          />
        ))}
      </CurrentApplication>
      <ConfigurationActions>
        {definition.actions.map((action) => (
          <ConfigurationAction
            key={action.title[0]}
            title={text(action.title)}
            description={text(action.description)}
            prompt={text(action.prompt)}
            steps={action.steps.map(text)}
          />
        ))}
      </ConfigurationActions>
    </div>
  );
}
