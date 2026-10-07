import { useTranslation } from '@nocobase/i18n/client';
import { ArrowRight, FileStack } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { RouteChildPage } from '@/components/route-child-page';
import { PageHeader } from '@/components/page-header';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';

import { routeChildPageTopics } from './topics.js';

export default function RouteChildPagesPage() {
  const { t } = useTranslation();
  return (
    <>
      <RouteChildPage>
        <PageContainer>
          <PageHeader
            description={t('routeOverlays.childPagesDescription')}
            title={t('routeOverlays.childPagesTitle')}
          />
          <ul className='grid gap-3 sm:grid-cols-3'>
            {Object.entries(routeChildPageTopics).map(([segment, topic]) => (
              <li
                className='flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md'
                key={segment}
              >
                <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                  <FileStack className='size-5' />
                </div>
                <h2 className='mt-5 font-heading text-lg font-semibold'>
                  {t(topic.name)}
                </h2>
                <p className='mt-2 flex-1 text-sm leading-6 text-muted-foreground'>
                  {t(topic.summary)}
                </p>
                <Button
                  className='mt-5 self-start'
                  nativeButton={false}
                  render={<Link to={segment} />}
                  size='sm'
                  variant='outline'
                >
                  {t('routeOverlays.openTopic')}
                  <ArrowRight />
                </Button>
              </li>
            ))}
          </ul>
        </PageContainer>
      </RouteChildPage>
      {/* The next layer is a sibling of this one, so the DOM gains no level per level of nesting. */}
      <Outlet />
    </>
  );
}
