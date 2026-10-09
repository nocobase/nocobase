import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowRight,
  Check,
  Code2,
  FileStack,
  Layers3,
  MessageSquare,
  PanelRight,
  Plus,
  Route,
  Sparkles,
} from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import { PageHeader } from '#components/page-header';
import { PageContainer } from '#components/page-container';

export default function RouteOverlaysPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const currentRoute = `${location.pathname}${location.search}`;
  const patterns = [
    {
      icon: MessageSquare,
      title: t('routeOverlays.dialogCardTitle'),
      description: t('routeOverlays.dialogCardDescription'),
      label: t('routeOverlays.dialogPattern'),
      features: [
        t('routeOverlays.dialogFeatureFocus'),
        t('routeOverlays.dialogFeatureNested'),
        t('routeOverlays.dialogFeatureConfirm'),
      ],
      action: t('routeOverlays.openDialog'),
      pathname: 'dialog',
    },
    {
      icon: PanelRight,
      title: t('routeOverlays.drawerCardTitle'),
      description: t('routeOverlays.drawerCardDescription'),
      label: t('routeOverlays.drawerPattern'),
      features: [
        t('routeOverlays.drawerFeatureContext'),
        t('routeOverlays.drawerFeatureNested'),
        t('routeOverlays.drawerFeatureHistory'),
      ],
      action: t('routeOverlays.openDrawer'),
      pathname: 'drawer',
    },
  ] as const;
  const steps = [
    {
      number: '01',
      title: t('routeOverlays.stepOneTitle'),
      description: t('routeOverlays.stepOneDescription'),
    },
    {
      number: '02',
      title: t('routeOverlays.stepTwoTitle'),
      description: t('routeOverlays.stepTwoDescription'),
    },
    {
      number: '03',
      title: t('routeOverlays.stepThreeTitle'),
      description: t('routeOverlays.stepThreeDescription'),
    },
  ] as const;

  return (
    <PageContainer>
      <PageHeader
        actions={
          <>
            <Button variant='outline'>
              <Sparkles />
              {t('routeOverlays.preview')}
            </Button>
            <Button>
              <Plus />
              {t('routeOverlays.newExample')}
            </Button>
          </>
        }
        description={t('routeOverlays.description')}
        title={t('routeOverlays.title')}
      />
      <div className='grid gap-4 md:grid-cols-2'>
        {patterns.map(
          ({
            action,
            description,
            features,
            icon: Icon,
            label,
            pathname,
            title,
          }) => (
            <article
              className='flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md'
              key={pathname}
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                  <Icon className='size-5' />
                </div>
                <Badge variant='secondary'>{label}</Badge>
              </div>
              <h2 className='mt-5 font-heading text-xl font-semibold'>
                {title}
              </h2>
              <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                {description}
              </p>
              <ul className='mt-5 space-y-2 text-sm text-muted-foreground'>
                {features.map((feature) => (
                  <li className='flex items-center gap-2' key={feature}>
                    <Check className='size-4 shrink-0 text-primary' />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className='mt-6 self-start'
                render={<Link to={{ pathname, search: location.search }} />}
                nativeButton={false}
                variant={pathname === 'dialog' ? 'default' : 'outline'}
              >
                {action}
                <ArrowRight />
              </Button>
            </article>
          ),
        )}
      </div>
      <section className='flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-6'>
        <div className='flex items-start gap-3'>
          <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <FileStack className='size-5' />
          </div>
          <div>
            <h2 className='font-heading text-lg font-semibold'>
              {t('routeOverlays.childPagesCardTitle')}
            </h2>
            <p className='mt-1 text-sm leading-6 text-muted-foreground'>
              {t('routeOverlays.childPagesCardDescription')}
            </p>
          </div>
        </div>
        <Button
          className='shrink-0'
          nativeButton={false}
          render={<Link to={{ pathname: 'pages', search: location.search }} />}
        >
          {t('routeOverlays.openChildPages')}
          <ArrowRight />
        </Button>
      </section>
      <div className='grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]'>
        <section className='rounded-xl border bg-card p-5 md:p-6'>
          <div className='flex items-start gap-3'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
              <Layers3 className='size-4' />
            </div>
            <div>
              <h2 className='font-heading text-lg font-semibold'>
                {t('routeOverlays.guideTitle')}
              </h2>
              <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                {t('routeOverlays.guideDescription')}
              </p>
            </div>
          </div>
          <ol className='mt-6 grid gap-4 sm:grid-cols-3'>
            {steps.map(({ description, number, title }) => (
              <li className='space-y-2' key={number}>
                <span className='font-mono text-xs font-semibold text-primary'>
                  {number}
                </span>
                <h3 className='text-sm font-medium'>{title}</h3>
                <p className='text-sm leading-5 text-muted-foreground'>
                  {description}
                </p>
              </li>
            ))}
          </ol>
          <div className='mt-6 flex flex-wrap items-center gap-2 border-t pt-4'>
            <span className='mr-1 text-sm font-medium'>
              {t('routeOverlays.deepLinks')}
            </span>
            <Button
              render={
                <Link
                  to={{ pathname: 'dialog/drawer', search: location.search }}
                />
              }
              nativeButton={false}
              size='sm'
              variant='ghost'
            >
              {t('routeOverlays.openDialogDrawer')}
              <ArrowRight />
            </Button>
            <Button
              render={
                <Link
                  to={{ pathname: 'drawer/dialog', search: location.search }}
                />
              }
              nativeButton={false}
              size='sm'
              variant='ghost'
            >
              {t('routeOverlays.openDrawerDialog')}
              <ArrowRight />
            </Button>
          </div>
        </section>
        <aside className='rounded-xl border bg-muted/30 p-5 md:p-6'>
          <div className='flex items-center gap-2 text-sm font-medium'>
            <Code2 className='size-4 text-primary' />
            {t('routeOverlays.currentRoute')}
          </div>
          <code className='mt-4 block overflow-x-auto rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground'>
            {currentRoute}
          </code>
          <div className='mt-5 flex items-start gap-2 text-sm text-muted-foreground'>
            <Route className='mt-0.5 size-4 shrink-0 text-primary' />
            <p>{t('routeOverlays.stateDescription')}</p>
          </div>
        </aside>
      </div>
      <Outlet />
    </PageContainer>
  );
}
