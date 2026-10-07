import { PageContainer } from '@/components/page-container';
import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowUpRight,
  BookOpen,
  ClipboardList,
  Database,
  Hash,
  Languages,
  FileText,
  FolderOpen,
  ShoppingCart,
  PanelsTopLeft,
  Printer,
  Plug,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

const examples = [
  { key: 'routeOverlays', path: '/route-overlays', icon: PanelsTopLeft },
  { key: 'articles', path: '/articles', icon: FileText },
  { key: 'numbers', path: '/numeric-examples', icon: Hash },
  { key: 'i18n', path: '/i18n-examples', icon: Languages },
  { key: 'externalCrm', path: '/external-crm', icon: Plug },
  { key: 'repository', path: '/repository-example/find-many', icon: Database },
  { key: 'crm', path: '/repository-example/crm', icon: Users },
  { key: 'orders', path: '/repository-example/orders', icon: ShoppingCart },
  { key: 'authorization', path: '/authorization-example', icon: ShieldCheck },
  { key: 'files', path: '/file-repository', icon: FolderOpen },
  {
    key: 'templatePrint',
    path: '/template-print-example',
    icon: Printer,
  },
  { key: 'routes', path: '/routes-example', icon: BookOpen },
  { key: 'workflows', path: '/settings/workflow/workflows', icon: Workflow },
  {
    key: 'notificationTasks',
    path: '/notification-example',
    icon: ClipboardList,
  },
  { key: 'aiEmployeeTasks', path: '/ai-employee-example', icon: Sparkles },
] as const;

export default function ExamplesHomePage(): ReactElement {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <header className='space-y-4 rounded-xl border bg-card p-6 md:p-8'>
        <p className='text-sm font-medium text-muted-foreground'>
          {t('examples.eyebrow')}
        </p>
        <h1 className='font-heading text-3xl font-semibold tracking-tight'>
          {t('examples.title')}
        </h1>
        <p className='max-w-2xl text-sm leading-relaxed text-muted-foreground'>
          {t('examples.description')}
        </p>
        <Button render={<Link to='/articles' />} nativeButton={false}>
          {t('examples.start')}
          <ArrowUpRight />
        </Button>
      </header>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {examples.map(({ key, path, icon: Icon }) => (
          <Link
            key={key}
            to={path}
            className='group flex flex-col gap-4 rounded-xl border bg-card p-6 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring'
          >
            <div className='flex items-center justify-between'>
              <Icon className='size-5 text-primary' />
              <ArrowUpRight className='size-4 text-muted-foreground' />
            </div>
            <h2 className='font-heading text-lg font-semibold'>
              {t(`examples.${key}.title`)}
            </h2>
            <p className='flex-1 text-sm leading-relaxed text-muted-foreground'>
              {t(`examples.${key}.description`)}
            </p>
            <span className='text-sm font-medium'>{t('examples.open')}</span>
          </Link>
        ))}
      </div>
      <p className='text-sm text-muted-foreground'>
        {t('examples.accessNote')}
      </p>
    </PageContainer>
  );
}
