import type { ReactElement } from 'react';
import { copyText } from '@nocobase/app-client';
import { useDetailCopy } from './use-detail-copy.js';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Copy,
  Layers,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { StatusBadge } from '#components/status-badge';
import { Button } from '#components/ui/button';
import { buttonVariants } from '#components/ui/button-variants';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#components/ui/collapsible';
import { Label } from '#components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs';
import { Textarea } from '#components/ui/textarea';
import { useRouteAccess, useRouteTree } from './route-context.js';
import { findCapabilityPage } from './find-capability-page.js';

export function CurrentApplication({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}): ReactElement | null {
  const { t } = useDetailCopy();
  return (
    <section className='overflow-hidden rounded-xl border bg-card'>
      <div className='border-b px-5 py-4'>
        <h3 className='text-base font-semibold'>
          {t('featureOverview.currentTitle')}
        </h3>
      </div>
      <div className='divide-y px-5'>{children}</div>
      {footer ? (
        <div className='space-y-3 border-t px-5 py-4 text-xs leading-5 text-muted-foreground'>
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export function ConfigurationItem({
  title,
  description,
  state,
  icon: Icon = Layers,
  children,
}: {
  title: string;
  description?: string;
  state?: boolean | 'loading';
  icon?: LucideIcon;
  children?: ReactNode;
}): ReactElement | null {
  const { t } = useDetailCopy();
  return (
    <div role='group' aria-label={title} className='flex gap-4 py-5'>
      <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
        <Icon className='size-5' aria-hidden />
      </div>
      <div className='min-w-0 flex-1 space-y-2'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h4 className='text-sm font-semibold'>{title}</h4>
          <StatusBadge size='sm' tone={state === true ? 'info' : 'neutral'}>
            {t(
              state === undefined
                ? 'featureOverview.layout.unknown'
                : `featureOverview.status.${state === 'loading' ? 'loading' : state ? 'connected' : 'pending'}`,
            )}
          </StatusBadge>
        </div>
        {description ? (
          <p className='text-sm leading-6 text-muted-foreground'>
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function InterfaceItem({
  names,
  paths = [],
  title,
  description,
  icon,
}: {
  names: readonly string[];
  paths?: readonly string[];
  title: string;
  description?: string;
  icon?: LucideIcon;
}): ReactElement | null {
  const { t } = useDetailCopy();
  const routes = useRouteTree();
  const access = useRouteAccess();
  const page = findCapabilityPage(routes, access.denied, names, paths);
  return (
    <ConfigurationItem
      title={title}
      description={description}
      state={!!page}
      icon={icon}
    >
      {page ? (
        access.loading ? (
          <p role='status' className='text-xs text-muted-foreground'>
            {t('featureOverview.apiKeys.checkingAccess')}
          </p>
        ) : page.denied ? (
          <p className='text-xs text-muted-foreground'>
            {t('featureOverview.apiKeys.interfaceDenied')}
          </p>
        ) : (
          <Link
            to={page.route.path}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            {t('featureOverview.layout.open')}
            <ArrowRight aria-hidden />
          </Link>
        )
      ) : null}
    </ConfigurationItem>
  );
}

export function ConfigurationActions({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}): ReactElement | null {
  const { t } = useDetailCopy();
  return (
    <section className='space-y-3'>
      <div className='flex items-center gap-2'>
        <Sparkles className='size-4 text-primary' aria-hidden />
        <h3 className='text-base font-semibold'>
          {title ?? t('featureOverview.layout.actionsTitle')}
        </h3>
      </div>
      <div className='space-y-3'>{children}</div>
    </section>
  );
}

export function ConfigurationAction({
  title,
  description,
  prompt,
  steps,
  configuration,
}: {
  title: string;
  description?: string;
  prompt: string | ReactNode;
  steps?: readonly string[];
  configuration?: ReactNode;
}): ReactElement | null {
  const { t } = useDetailCopy();
  return (
    <Collapsible className='overflow-hidden rounded-xl border bg-card'>
      <CollapsibleTrigger className='group flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-medium transition-colors hover:bg-accent/50'>
        <span className='flex min-w-0 items-center gap-3'>
          <span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <ArrowUpRight className='size-4' aria-hidden />
          </span>
          <span className='min-w-0 space-y-1'>
            <span className='block'>{title}</span>
            {description ? (
              <span className='block text-xs font-normal leading-5 text-muted-foreground'>
                {description}
              </span>
            ) : null}
          </span>
        </span>
        <ChevronDown
          className='size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180'
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent keepMounted className='border-t p-4'>
        <Tabs defaultValue='agent' className='gap-4'>
          <TabsList aria-label={title} className='max-w-full'>
            <TabsTrigger value='agent'>
              {t('featureOverview.agentTab')}
            </TabsTrigger>
            <TabsTrigger value='manual'>
              {t('featureOverview.manualTab')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value='agent' keepMounted>
            {typeof prompt === 'string' ? (
              <ConfigurationPrompt value={prompt} />
            ) : (
              prompt
            )}
          </TabsContent>
          <TabsContent value='manual' keepMounted className='space-y-4'>
            {steps?.length ? (
              <ol className='list-decimal space-y-3 pl-5 text-sm leading-6'>
                {steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : null}
            {configuration}
          </TabsContent>
        </Tabs>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ConfigurationPrompt({ value: original }: { value: string }) {
  const { t } = useDetailCopy();
  const id = useId();
  const [draft, setDraft] = useState<string>();
  const [status, setStatus] = useState<
    'idle' | 'copying' | 'copied' | 'failed'
  >('idle');
  const revisionRef = useRef(0);
  const value = draft ?? original;
  async function copy() {
    const current = ++revisionRef.current;
    setStatus('copying');
    let success = false;
    try {
      success = await copyText(value);
    } catch {
      /* Keep manual copying available. */
    }
    if (current === revisionRef.current)
      setStatus(success ? 'copied' : 'failed');
  }
  return (
    <div className='space-y-3'>
      <p className='text-sm leading-6 text-muted-foreground'>
        {t('featureOverview.layout.promptHint')}
      </p>
      <Label htmlFor={id}>{t('featureOverview.promptLabel')}</Label>
      <Textarea
        id={id}
        className='max-h-96 min-h-48 resize-y text-sm leading-6'
        value={value}
        onChange={(event) => {
          setDraft(event.target.value);
          revisionRef.current++;
          setStatus('idle');
        }}
      />
      <div className='flex flex-wrap items-center gap-3'>
        <Button
          disabled={status === 'copying' || !value.trim()}
          onClick={() => void copy()}
        >
          <Copy aria-hidden />
          {t('featureOverview.copy')}
        </Button>
        <span role='status' className='text-sm text-muted-foreground'>
          {status === 'copied'
            ? t('featureOverview.copied')
            : status === 'failed'
              ? t('featureOverview.copyFailed')
              : ''}
        </span>
      </div>
    </div>
  );
}
