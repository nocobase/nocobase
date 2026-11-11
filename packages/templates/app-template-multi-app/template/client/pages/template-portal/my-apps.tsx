import { useEffect, useState } from 'react';
import { NavigationProgress } from '@nocobase/app-plugin-platform-sso/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Outlet } from 'react-router';
import {
  FlaskConical,
  ShieldAlert,
  Monitor,
  ClipboardCheck,
  Leaf,
  Package,
  Warehouse,
  Bot,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Card, CardContent } from '#components/ui/card';
import { Button } from '#components/ui/button';
import { platformLoginUrl } from './links.js';
import { usePortalData, isTerminalError, safeUrl } from './data.js';
import { Feedback } from './management-ui.js';
interface WorkbenchApp {
  id: string;
  name: string;
  url: string;
  entryUrl?: string;
  template: string;
  templateName: string;
}
const icons: Record<string, { icon: LucideIcon; tone: number }> = {
  reagents: { icon: FlaskConical, tone: 1 },
  chemicals: { icon: ShieldAlert, tone: 2 },
  devices: { icon: Monitor, tone: 3 },
  inspections: { icon: ClipboardCheck, tone: 4 },
  environment: { icon: Leaf, tone: 2 },
  assets: { icon: Package, tone: 1 },
  storage: { icon: Warehouse, tone: 5 },
  robots: { icon: Bot, tone: 3 },
};
export default function Workbench() {
  const { t } = useTranslation(),
    request = usePortalData<{ data: WorkbenchApp[] }>('multiApp/myApps');
  const apps = request.data?.data ?? [];
  const [entering, setEntering] = useState<string>();
  useEffect(() => {
    const clear = () => setEntering(undefined);
    window.addEventListener('pageshow', clear);
    const timer = window.setTimeout(clear, 15000);
    return () => {
      window.removeEventListener('pageshow', clear);
      window.clearTimeout(timer);
    };
  }, [entering]);
  return (
    <PageContainer>
      {entering ? (
        <NavigationProgress
          label={`${t('sso.entering')} ${apps.find((app) => app.id === entering)?.name ?? ''}`}
        />
      ) : null}
      <PageHeader
        title={t('portal.myApps')}
        description={t('portal.workbenchDescription')}
      />
      {request.error || !request.data ? (
        <div className='flex flex-col items-start gap-3'>
          <Feedback error={request.error} />
          {request.error && !isTerminalError(request.error) ? (
            <Button variant='outline' onClick={request.reload}>
              {t('sso.retry')}
            </Button>
          ) : null}
        </div>
      ) : apps.length ? (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {apps.map((app) => {
            const { icon: Icon, tone } = icons[app.template] ?? {
              icon: LayoutGrid,
              tone: 3,
            };
            const url = safeUrl(app.url);
            if (!url) return null;
            return (
              <a
                key={app.id}
                href={
                  app.entryUrl ? safeUrl(app.entryUrl) : platformLoginUrl(url)
                }
                aria-label={app.name}
                aria-busy={entering === app.id}
                onClick={(event) => {
                  if (
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  if (entering) {
                    event.preventDefault();
                    return;
                  }
                  setEntering(app.id);
                }}
                className='block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring'
              >
                <Card className='h-full transition-colors hover:bg-accent/40 hover:ring-primary/40'>
                  <CardContent className='flex h-full flex-col gap-3'>
                    <span
                      className='inline-flex size-11 shrink-0 items-center justify-center rounded-xl'
                      style={{
                        color: `var(--chart-${tone})`,
                        background: `color-mix(in srgb,var(--chart-${tone}) 12%,transparent)`,
                      }}
                    >
                      <Icon className='size-6' aria-hidden='true' />
                    </span>
                    <div>
                      <h2 className='break-words text-base font-semibold'>
                        {app.name}
                      </h2>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {app.templateName}
                      </p>
                      <p className='mt-1 text-sm leading-5 text-muted-foreground'>
                        {app.template in icons
                          ? t(`portal.workbenchDescriptions.${app.template}`)
                          : t('portal.workbenchAppDescription', {
                              name: app.templateName || app.name,
                            })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      ) : (
        <p className='rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground'>
          {t('portal.workbenchEmpty')}
        </p>
      )}
      <Outlet />
    </PageContainer>
  );
}
