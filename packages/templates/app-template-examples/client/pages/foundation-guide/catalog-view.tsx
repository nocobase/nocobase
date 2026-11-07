import { useTranslation } from '@nocobase/i18n/client';
import {
  Link,
  Outlet,
  useParams,
  useResolvedPath,
  useOutletContext,
} from 'react-router';
import { Search, ChevronRight } from 'lucide-react';
import { cn } from 'cn';
import { Button, buttonVariants } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Badge } from '#components/ui/badge';
import {
  packages,
  type GuideFilter,
  type GuideSearchContext,
} from './catalog.js';
import { PackageDetail } from './detail.js';

function Catalog({ kind }: { readonly kind: GuideFilter }) {
  const { t } = useTranslation();
  const { packageId } = useParams();
  const base = useResolvedPath('.').pathname.replace(/\/$/, '');
  const { query, setQuery } = useOutletContext<GuideSearchContext>();
  const entries = packages
    .filter((item) => kind === 'all' || item.kind === kind)
    .sort((left, right) => left.name.localeCompare(right.name, 'en'));
  const normalized = query.trim().toLocaleLowerCase();
  const visible = entries.filter((item) => {
    const copyKey = item.copyKey ?? item.id;
    const searchText = [
      item.name,
      t(`foundationGuide.packages.${copyKey}.title`),
      t(`foundationGuide.business.${copyKey}.summary`),
      t(`foundationGuide.business.${copyKey}.scenario`),
      item.core?.name,
      item.core ? t(`foundationGuide.packages.${copyKey}.coreSummary`) : '',
      t(
        item.kind === 'kernel'
          ? 'foundationGuide.coreLabel'
          : item.category === 'example'
            ? 'foundationGuide.exampleLabel'
            : item.category === 'skill'
              ? 'foundationGuide.skillLabel'
              : 'foundationGuide.pluginLabel',
      ),
    ].join(' ');
    return searchText.toLocaleLowerCase().includes(normalized);
  });
  const selected = packageId ?? visible[0]?.id;
  return (
    <div className='grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]'>
      <aside
        className={cn(
          'min-w-0 space-y-4 lg:sticky lg:top-4',
          packageId && 'hidden lg:block',
        )}
        aria-label={t('foundationGuide.catalog')}
      >
        <div className='relative'>
          <Search
            className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
            aria-hidden
          />
          <Input
            type='search'
            className='h-9 bg-background pl-9'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t('foundationGuide.search')}
            placeholder={t('foundationGuide.search')}
          />
        </div>
        <p className='text-xs leading-5 text-muted-foreground'>
          {t(`foundationGuide.${kind}Intro`)}
        </p>
        <div className='space-y-5 lg:max-h-[calc(100dvh-21rem)] lg:overflow-y-auto lg:pr-2'>
          <ul className='space-y-1'>
            {visible.map((item) => (
              <li key={item.id}>
                <Link
                  to={`${base}/${item.id}`}
                  aria-current={selected === item.id ? 'page' : undefined}
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'flex h-auto w-full justify-start gap-2 rounded-lg px-3 py-3 text-left whitespace-normal aria-[current=page]:bg-accent aria-[current=page]:text-primary',
                  )}
                >
                  <span className='min-w-0 flex-1'>
                    <span className='flex items-start justify-between gap-2 text-sm font-medium'>
                      <span>
                        {t(
                          `foundationGuide.packages.${item.copyKey ?? item.id}.title`,
                        )}
                      </span>{' '}
                      <Badge
                        variant='outline'
                        data-size='sm'
                        className='shrink-0'
                      >
                        {t(
                          item.kind === 'kernel'
                            ? 'foundationGuide.coreLabel'
                            : 'foundationGuide.pluginLabel',
                        )}
                      </Badge>
                    </span>
                  </span>
                  {selected === item.id ? (
                    <ChevronRight className='size-3.5 shrink-0' aria-hidden />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
          {!visible.length ? (
            <div
              role='status'
              className='space-y-3 rounded-lg border border-dashed p-5 text-sm text-muted-foreground'
            >
              <p>{t('foundationGuide.noResults')}</p>
              <Button size='sm' variant='outline' onClick={() => setQuery('')}>
                {t('foundationGuide.clear')}
              </Button>
            </div>
          ) : null}
        </div>
        <p className='border-t pt-4 text-xs leading-5 text-muted-foreground'>
          {t(
            kind === 'plugins'
              ? 'foundationGuide.scopeNote'
              : 'foundationGuide.kernelScopeNote',
          )}
        </p>
      </aside>
      <div className={cn('min-w-0', !packageId && 'hidden lg:block')}>
        {packageId ? (
          <Outlet context={{ kind }} />
        ) : selected ? (
          <PackageDetail kind={kind} packageId={selected} />
        ) : null}
      </div>
    </div>
  );
}

export function AllCatalog() {
  return <Catalog kind='all' />;
}
export function KernelCatalog() {
  return <Catalog kind='kernel' />;
}
export function PluginCatalog() {
  return <Catalog kind='plugins' />;
}
