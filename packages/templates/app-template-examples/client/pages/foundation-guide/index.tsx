import { useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { BookOpen, Box, Layers, ArrowUpRight, Puzzle } from 'lucide-react';
import {
  Navigate,
  NavLink,
  Outlet,
  Link,
  useLocation,
  useResolvedPath,
} from 'react-router';
import { cn } from 'cn';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { buttonVariants } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { packages, type GuideSearchContext } from './catalog.js';

export default function FoundationGuide() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const location = useLocation();
  const base = useResolvedPath('.').pathname.replace(/\/$/, '');
  if (location.pathname.replace(/\/$/, '') === base)
    return (
      <Navigate
        replace
        to={{ pathname: `${base}/all`, search: location.search }}
      />
    );
  return (
    <PageContainer className='mx-auto max-w-7xl'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Layers className='size-4' aria-hidden />
        <span>NocoBase Core</span>
        <span aria-hidden>/</span>
        <span>{t('foundationGuide.eyebrow')}</span>
        <Badge variant='outline' data-size='sm'>
          {t('foundationGuide.preview')}
        </Badge>
      </div>
      <PageHeader
        title={t('foundationGuide.title')}
        description={t('foundationGuide.description')}
        actions={
          <Link
            to='/foundation'
            className={buttonVariants({ variant: 'outline' })}
          >
            <ArrowUpRight aria-hidden />
            {t('foundationGuide.overview')}
          </Link>
        }
      />
      <div className='flex flex-wrap items-end justify-between gap-4 border-b'>
        <nav
          aria-label={t('foundationGuide.filters')}
          className='grid w-full grid-cols-3 gap-1 sm:flex sm:w-auto sm:gap-2'
        >
          {(['all', 'kernel', 'plugins'] as const).map((kind) => {
            const Icon =
              kind === 'all' ? Layers : kind === 'kernel' ? Box : Puzzle;
            return (
              <NavLink
                key={kind}
                to={`${base}/${kind}`}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'h-11 gap-1.5 rounded-none border-b-2 border-b-transparent px-2 text-muted-foreground aria-[current=page]:border-b-primary aria-[current=page]:text-primary sm:gap-2 sm:px-4',
                )}
              >
                <Icon className='size-4' aria-hidden />
                {t(`foundationGuide.${kind}`)}
                <span className='text-xs tabular-nums opacity-70'>
                  {
                    packages.filter(
                      (item) => kind === 'all' || item.kind === kind,
                    ).length
                  }
                </span>
              </NavLink>
            );
          })}
        </nav>
        <p className='flex items-center gap-1.5 pb-3 text-xs text-muted-foreground'>
          <BookOpen className='size-3.5' aria-hidden />
          {t('foundationGuide.scope', {
            count: packages.length,
            examples: packages.filter((item) => item.category === 'example')
              .length,
          })}
        </p>
      </div>
      <Outlet context={{ query, setQuery } satisfies GuideSearchContext} />
    </PageContainer>
  );
}
