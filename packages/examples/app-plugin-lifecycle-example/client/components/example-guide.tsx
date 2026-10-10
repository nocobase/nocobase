import { useState, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { ChevronDown, Lightbulb } from 'lucide-react';

import { NAMESPACE } from '../lib/format.js';
import { GUIDE_STEPS, type GuidePage } from '../lib/guide.js';
import { cn } from '../lib/utils.js';
import { Card, CardContent } from './ui/card.js';

const storageKey = (page: GuidePage): string =>
  `lifecycleExample.guide.${page}`;

// Only a convenience: a browser that keeps nothing shows the guide open.
function readCollapsed(page: GuidePage): boolean {
  try {
    return window.localStorage.getItem(storageKey(page)) === 'collapsed';
  } catch {
    return false;
  }
}

function writeCollapsed(page: GuidePage, collapsed: boolean): void {
  try {
    if (collapsed) window.localStorage.setItem(storageKey(page), 'collapsed');
    else window.localStorage.removeItem(storageKey(page));
  } catch {
    // Nothing to remember it in.
  }
}

/**
 * What a page is for and how to try it, above the page itself. A reader who
 * has read it folds it away, and the page remembers that in this browser.
 */
export function ExampleGuide({
  page,
}: {
  readonly page: GuidePage;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const [collapsed, setCollapsed] = useState(() => readCollapsed(page));
  const toggle = (): void => {
    writeCollapsed(page, !collapsed);
    setCollapsed(!collapsed);
  };
  const steps = Array.from(
    { length: GUIDE_STEPS[page] },
    (_, index) => `guide.${page}.step${String(index + 1)}`,
  );

  return (
    <Card className='bg-muted/40'>
      <CardContent className='space-y-3'>
        <button
          type='button'
          onClick={toggle}
          aria-expanded={!collapsed}
          className='flex w-full items-center gap-2 text-left'
        >
          <Lightbulb className='size-4 shrink-0 text-primary' />
          <span className='min-w-0 flex-1 font-medium'>{t('guide.title')}</span>
          <span className='text-xs text-muted-foreground'>
            {collapsed ? t('guide.show') : t('guide.hide')}
          </span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              !collapsed && 'rotate-180',
            )}
          />
        </button>
        {collapsed ? null : (
          <div className='grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'>
            <section className='space-y-1.5'>
              <h3 className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
                {t('guide.purpose')}
              </h3>
              <p className='leading-6'>{t(`guide.${page}.purpose`)}</p>
            </section>
            <section className='space-y-1.5'>
              <h3 className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
                {t('guide.howTo')}
              </h3>
              <ol className='list-decimal space-y-1 pl-5 leading-6'>
                {steps.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ol>
              <p className='text-xs text-muted-foreground'>
                {t('guide.samples')}
              </p>
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
