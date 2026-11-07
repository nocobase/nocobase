import { useTranslation } from '@nocobase/i18n/client';
import { ArrowUpRight, BookOpen, ChevronDown, Code2 } from 'lucide-react';
import { buttonVariants } from '#components/ui/button';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '#components/ui/collapsible';
import { cn } from 'cn';
import { sourceUrl, SOURCE_REVISION, type GuidePackage } from './catalog.js';

const driveExample = `// server/config/drive.ts
import { defineAppConfig } from '@nocobase/app-server/config';

export default defineAppConfig(({ paths }) => ({
  default: 'local',
  disks: {
    local: {
      driver: 'fs',
      location: paths.storage('files'),
      visibility: 'private',
    },
  },
}));`;

export function TechnicalReference({
  entry,
}: {
  readonly entry: GuidePackage;
}) {
  const { t } = useTranslation();
  const copyKey = entry.copyKey ?? entry.id;
  return (
    <Collapsible key={entry.id} className='border-t pt-5'>
      <CollapsibleTrigger
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'group w-full justify-between',
        )}
      >
        {t('foundationGuide.technicalReference')}
        <ChevronDown
          className='size-4 transition-transform group-aria-expanded:rotate-180'
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='space-y-6 pt-4'>
          <p className='font-mono text-xs break-all text-muted-foreground'>
            {entry.name}
          </p>
          <p className='text-sm leading-6 text-muted-foreground'>
            {t(`foundationGuide.packages.${copyKey}.summary`)}
          </p>
          <div className='flex flex-wrap gap-2'>
            {entry.docs ? (
              <a
                href={sourceUrl(entry.docs)}
                target='_blank'
                rel='noreferrer'
                className={buttonVariants()}
              >
                <BookOpen aria-hidden />
                {t('foundationGuide.docs')}
                <ArrowUpRight aria-hidden />
              </a>
            ) : null}
            {entry.path ? (
              <a
                href={`https://github.com/nocobase/nocobase/tree/${SOURCE_REVISION}/${entry.path}`}
                target='_blank'
                rel='noreferrer'
                className={buttonVariants({ variant: 'ghost' })}
              >
                <Code2 aria-hidden />
                {t('foundationGuide.source')}
              </a>
            ) : null}
          </div>
          <section>
            <h3 className='mb-4 text-sm font-semibold'>
              {t('foundationGuide.steps')}
            </h3>
            <ol className='space-y-4'>
              {[1, 2, 3].map((step) => (
                <li key={step} className='flex gap-3'>
                  <span className='flex size-6 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-medium tabular-nums text-muted-foreground'>
                    {step}
                  </span>
                  <p className='pt-0.5 text-sm leading-6'>
                    {t(`foundationGuide.packages.${copyKey}.step${step}`)}
                  </p>
                </li>
              ))}
            </ol>
          </section>
          {entry.core ? (
            <section aria-label={t('foundationGuide.underlyingCore')}>
              <h3 className='mb-2 text-sm font-semibold'>
                {t('foundationGuide.underlyingCore')}
              </h3>
              <p className='font-mono text-xs break-all text-muted-foreground'>
                {entry.core.name}
              </p>
              <p className='mt-3 text-sm leading-6'>
                {t(`foundationGuide.packages.${copyKey}.coreSummary`)}
              </p>
              <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                {t(`foundationGuide.packages.${copyKey}.coreUsage`)}
              </p>
              <a
                href={sourceUrl(entry.core.docs)}
                target='_blank'
                rel='noreferrer'
                className={cn(buttonVariants({ variant: 'outline' }), 'mt-3')}
              >
                <BookOpen aria-hidden />
                {t('foundationGuide.coreDocs')}
                <ArrowUpRight aria-hidden />
              </a>
            </section>
          ) : null}
          {entry.id === 'app-plugin-file' ? (
            <section className='overflow-hidden rounded-lg border'>
              <div className='flex items-center gap-2 border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground'>
                <Code2 className='size-3.5' aria-hidden />
                {t('foundationGuide.snippet')}
                <span className='ml-auto font-mono'>TypeScript</span>
              </div>
              <pre className='overflow-x-auto bg-muted/20 p-4 text-xs leading-6'>
                <code>{driveExample}</code>
              </pre>
              <p className='border-t px-4 py-2 text-xs leading-5 text-muted-foreground'>
                {t('foundationGuide.snippetNote')}
              </p>
            </section>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
