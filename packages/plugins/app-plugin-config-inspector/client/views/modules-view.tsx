import { ChevronDown, Search } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import {
  MODULE_GROUPS,
  matchesSearch,
  type ModuleView,
} from '../../shared/modules.js';
import { REDACTED, type InspectedSetting } from '../../shared/snapshot.js';
import { Input } from '../components/ui/input.js';
import {
  CustomizedDot,
  NoteBadge,
  SourceBadge,
  Value,
  useInspectorT,
} from './shared.js';

/** The settings grouped into modules, each row opening to its fields. */
export function ModulesView({
  modules,
  customized,
}: {
  modules: readonly ModuleView[];
  customized: number;
}): ReactElement {
  const t = useInspectorT();
  const [query, setQuery] = useState('');
  const [onlyCustomized, setOnlyCustomized] = useState(false);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const title = (module: ModuleView): string =>
    module.definition ? t(`modules.${module.key}.title`) : module.key;
  const description = (module: ModuleView): string | undefined =>
    module.definition ? t(`modules.${module.key}.description`) : module.comment;

  const shown = modules
    .map((module) => {
      const moduleMatches = matchesSearch(query, [
        title(module),
        description(module),
        module.key,
      ]);
      const settings = module.settings.filter(
        (setting) =>
          (!onlyCustomized || setting.customized) &&
          (moduleMatches ||
            matchesSearch(query, [
              setting.path,
              setting.variable,
              setting.secret ? undefined : setting.value,
            ])),
      );
      const visible = onlyCustomized
        ? settings.length > 0
        : moduleMatches || settings.length > 0;
      return visible ? { module, settings } : undefined;
    })
    .filter((item) => item !== undefined);
  const searching = query.trim() !== '';

  return (
    <div className='grid gap-3'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <label className='relative flex-1'>
          <Search
            aria-hidden
            className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground'
          />
          <Input
            type='search'
            value={query}
            className='pl-8'
            aria-label={t('search')}
            placeholder={t('search')}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className='inline-flex items-center gap-2 text-sm whitespace-nowrap'>
          <input
            type='checkbox'
            className='size-4 accent-primary'
            checked={onlyCustomized}
            onChange={(event) => setOnlyCustomized(event.target.checked)}
          />
          {t('onlyCustomized', { count: customized })}
        </label>
      </div>
      {shown.length ? (
        <div className='overflow-hidden rounded-lg border'>
          {MODULE_GROUPS.map((group) => {
            const items = shown.filter((item) => item.module.group === group);
            if (!items.length) return null;
            const hint =
              group === 'scaling'
                ? t('groups.scalingHint')
                : group === 'other'
                  ? t('groups.otherHint')
                  : undefined;
            return (
              <div key={group} className='border-b last:border-b-0'>
                <div className='flex flex-col gap-x-4 border-b bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-5'>
                  <span>{t(`groups.${group}`)}</span>
                  {hint ? <span>{hint}</span> : null}
                </div>
                {items.map(({ module, settings }) => {
                  const expanded = searching || open.has(module.key);
                  const toggle = (): void => {
                    const next = new Set(open);
                    if (next.has(module.key)) next.delete(module.key);
                    else next.add(module.key);
                    setOpen(next);
                  };
                  return (
                    <div key={module.key} className='border-b last:border-b-0'>
                      <button
                        type='button'
                        aria-expanded={expanded}
                        onClick={toggle}
                        className='grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3 text-left hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:px-5'
                      >
                        <span className='min-w-0'>
                          <span className='flex items-center gap-1.5 text-sm font-semibold'>
                            {title(module)}
                            {module.customized ? <CustomizedDot /> : null}
                          </span>
                          <span className='block text-sm text-muted-foreground sm:truncate'>
                            {summary(module, t) ?? description(module) ?? ''}
                          </span>
                        </span>
                        <ModuleBadges module={module} />
                        <ChevronDown
                          aria-hidden
                          className={`col-start-2 row-start-1 size-4 text-muted-foreground transition-transform sm:col-start-3 ${expanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {expanded ? (
                        <div className='px-4 pb-3 sm:px-5'>
                          <div className='rounded-md border bg-muted/20'>
                            {summary(module, t) && description(module) ? (
                              <p className='border-b border-dashed px-3 py-2 text-xs text-muted-foreground'>
                                {description(module)}
                              </p>
                            ) : null}
                            {settings.length ? (
                              settings.map((setting) => (
                                <SettingRow
                                  key={setting.path}
                                  setting={setting}
                                  prefix={prefixOf(module, setting.path)}
                                />
                              ))
                            ) : (
                              <p className='px-3 py-2 text-xs text-muted-foreground'>
                                {t('emptyModule')}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : (
        <p className='rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground'>
          {t('noMatch')}
        </p>
      )}
      <div className='flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground'>
        <span className='inline-flex items-center gap-1.5'>
          <CustomizedDot />
          {t('legend.customized')}
        </span>
        {(['file', 'environment', 'default'] as const).map((source) => (
          <span key={source} className='inline-flex items-center gap-1.5'>
            <SourceBadge source={source} />
            {t(`legend.${source}`)}
          </span>
        ))}
      </div>
    </div>
  );
}

function ModuleBadges({ module }: { module: ModuleView }): ReactElement {
  const t = useInspectorT();
  return (
    <span className='col-span-1 row-start-2 flex flex-wrap gap-1.5 sm:col-start-2 sm:row-start-1 sm:justify-end'>
      {module.fromEnvironment ? (
        <NoteBadge tone='environment'>
          {t('fromEnvironment', { count: module.fromEnvironment })}
        </NoteBadge>
      ) : null}
      {module.empty ? (
        <NoteBadge>{t('notConfigured')}</NoteBadge>
      ) : module.off ? (
        <NoteBadge>{t('notEnabled')}</NoteBadge>
      ) : null}
      {module.firstStartOnly ? (
        <NoteBadge tone='warning'>{t('firstStartOnly')}</NoteBadge>
      ) : null}
    </span>
  );
}

function SettingRow({
  setting,
  prefix,
}: {
  setting: InspectedSetting;
  prefix: string;
}): ReactElement {
  const t = useInspectorT();
  const label = prefix ? setting.path.slice(prefix.length + 1) : setting.path;
  return (
    <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-t border-dashed px-3 py-2.5 text-sm first:border-t-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]'>
      <div className='min-w-0'>
        <div className='flex items-center gap-1.5 font-medium break-all'>
          {label || setting.path}
          {setting.customized ? <CustomizedDot /> : null}
        </div>
        <div className='font-mono text-xs break-all text-muted-foreground'>
          {setting.path}
        </div>
      </div>
      <div className='col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1'>
        <Value value={setting.value} />
        {setting.fileValue !== undefined ? (
          <div className='mt-0.5 text-xs text-muted-foreground'>
            {t('overrides')}{' '}
            <s className='font-mono'>
              {setting.fileValue === REDACTED ? '••••••' : setting.fileValue}
            </s>
          </div>
        ) : null}
      </div>
      <div className='col-start-2 row-start-1 flex flex-col items-end gap-1 sm:col-start-3'>
        <SourceBadge source={setting.source} />
        {setting.variable ? (
          <span className='font-mono text-xs text-muted-foreground'>
            {setting.variable}
          </span>
        ) : null}
        {setting.firstStartOnly ? (
          <NoteBadge tone='warning'>{t('firstStartOnly')}</NoteBadge>
        ) : null}
      </div>
    </div>
  );
}

function prefixOf(module: ModuleView, path: string): string {
  const prefixes = module.definition?.prefixes ?? [module.key];
  return (
    prefixes
      .filter((prefix) => path.startsWith(`${prefix}.`))
      .sort((a, b) => b.length - a.length)[0] ?? ''
  );
}

/** Up to three values set outside the code defaults, such as `level debug · file.enabled true`. */
function summary(
  module: ModuleView,
  t: (key: string) => string,
): string | undefined {
  const parts = module.settings
    .filter((setting) => setting.source !== 'default' && setting.value !== '')
    .slice(0, 3)
    .map((setting) => {
      const label = setting.path
        .slice(prefixOf(module, setting.path).length)
        .replace(/^\./u, '');
      const value =
        setting.value === REDACTED
          ? t('configured')
          : setting.value.length > 48
            ? `${setting.value.slice(0, 45)}…`
            : setting.value;
      return `${label} ${value}`;
    });
  return parts.length ? parts.join(' · ') : undefined;
}
