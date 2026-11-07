import { useState } from 'react';
import { copyText } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Link, useOutletContext, useParams } from 'react-router';
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  Package,
  Play,
  Puzzle,
} from 'lucide-react';
import { Button, buttonVariants } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { cn } from 'cn';
import { packages, type GuideFilter } from './catalog.js';
import { TechnicalReference } from './technical-reference.js';

function AgentPrompt({ copyKey }: { readonly copyKey: string }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const prompt = `${t(`foundationGuide.business.${copyKey}.prompt`)}\n\n${t('foundationGuide.promptEnding')}`;
  async function copy() {
    try {
      setStatus((await copyText(prompt)) ? 'copied' : 'failed');
    } catch {
      setStatus('failed');
    }
  }
  return (
    <section
      aria-label={t('foundationGuide.agentPrompt')}
      className='space-y-3'
    >
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h3 className='text-sm font-semibold'>
          {t('foundationGuide.agentPrompt')}
        </h3>
        <Button onClick={() => void copy()}>
          <Copy aria-hidden />
          {t('foundationGuide.copyPrompt')}
        </Button>
      </div>
      <p className='text-xs leading-5 text-muted-foreground'>
        {t('foundationGuide.promptHint')}
      </p>
      <p className='rounded-lg border bg-muted/30 p-4 text-sm leading-7 whitespace-pre-line select-text'>
        {prompt}
      </p>
      <p
        role='status'
        className={cn(
          'text-xs',
          status === 'failed' ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        {status === 'idle'
          ? ''
          : t(
              `foundationGuide.${status === 'copied' ? 'promptCopied' : 'promptCopyFailed'}`,
            )}
      </p>
    </section>
  );
}

export function PackageDetail({
  kind,
  packageId,
}: {
  readonly kind: GuideFilter;
  readonly packageId: string;
}) {
  const { t } = useTranslation();
  const entry = packages.find(
    (item) => item.id === packageId && (kind === 'all' || item.kind === kind),
  );
  const back = `/foundation-guide/${kind}`;
  if (!entry)
    return (
      <div className='space-y-4 rounded-xl border bg-card p-6' role='status'>
        <h2 className='font-semibold'>{t('foundationGuide.missing')}</h2>
        <p className='text-sm text-muted-foreground'>
          {t('foundationGuide.missingHint')}
        </p>
        <Link to={back} className={buttonVariants({ variant: 'outline' })}>
          {t('foundationGuide.back')}
        </Link>
      </div>
    );
  const copyKey = entry.copyKey ?? entry.id;
  return (
    <article className='overflow-hidden rounded-xl border bg-card text-card-foreground'>
      <div className='space-y-5 border-b p-5 md:p-7'>
        <Link
          to={back}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            '-ml-2 lg:hidden',
          )}
        >
          <ArrowLeft className='size-4' aria-hidden />
          {t('foundationGuide.back')}
        </Link>
        <div className='flex items-center gap-4'>
          <div className='flex size-12 shrink-0 items-center justify-center rounded-xl border bg-background text-primary'>
            {entry.kind === 'kernel' ? (
              <Package className='size-6' aria-hidden />
            ) : (
              <Puzzle className='size-6' aria-hidden />
            )}
          </div>
          <div className='flex min-w-0 flex-1 flex-wrap items-center gap-2'>
            <h2 className='font-heading text-xl font-semibold'>
              {t(`foundationGuide.packages.${copyKey}.title`)}
            </h2>
            <Badge variant='secondary' data-size='sm'>
              {t(
                entry.kind === 'kernel'
                  ? 'foundationGuide.coreLabel'
                  : entry.category === 'example'
                    ? 'foundationGuide.exampleLabel'
                    : entry.category === 'skill'
                      ? 'foundationGuide.skillLabel'
                      : 'foundationGuide.pluginLabel',
              )}
            </Badge>
          </div>
        </div>
        <p className='max-w-2xl text-sm leading-6'>
          {t(`foundationGuide.business.${copyKey}.summary`)}
        </p>
        {entry.demo ? (
          <Link
            to={entry.demo}
            className={buttonVariants({ variant: 'outline' })}
          >
            <Play aria-hidden />
            {t('foundationGuide.demo')}
          </Link>
        ) : null}
      </div>
      <div className='space-y-7 p-5 md:p-7'>
        <section>
          <h3 className='mb-2 text-sm font-semibold'>
            {t('foundationGuide.scenario')}
          </h3>
          <p className='text-sm leading-6 text-muted-foreground'>
            {t(`foundationGuide.business.${copyKey}.scenario`)}
          </p>
        </section>
        <AgentPrompt key={copyKey} copyKey={copyKey} />
        {entry.related.length ? (
          <section className='border-t pt-5'>
            <h3 className='text-sm font-semibold'>
              {t('foundationGuide.relationships')}
            </h3>
            <p className='mt-1 text-xs leading-5 text-muted-foreground'>
              {t('foundationGuide.relatedHint')}
            </p>
            <ul className='mt-3 grid gap-2 sm:grid-cols-2'>
              {entry.related.map((id) => {
                const related = packages.find((item) => item.id === id);
                if (!related) return null;
                return (
                  <li key={id}>
                    <Link
                      to={`/foundation-guide/${kind === 'all' ? 'all' : related.kind}/${related.id}`}
                      className={cn(
                        buttonVariants({ variant: 'outline' }),
                        'flex h-auto w-full justify-between gap-2 px-3 py-3 text-left whitespace-normal',
                      )}
                    >
                      <span className='min-w-0 text-sm'>
                        {t(
                          `foundationGuide.packages.${related.copyKey ?? id}.title`,
                        )}
                      </span>
                      <ChevronRight className='size-3.5 shrink-0' aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
        <TechnicalReference entry={entry} />
      </div>
    </article>
  );
}

export default function DetailRoute() {
  const { kind } = useOutletContext<{ kind: GuideFilter }>();
  const { packageId = '' } = useParams();
  return <PackageDetail kind={kind} packageId={packageId} />;
}
