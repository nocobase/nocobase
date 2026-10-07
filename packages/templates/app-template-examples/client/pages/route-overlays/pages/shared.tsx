import { useTranslation } from '@nocobase/i18n/client';
import { Layers3, MessageSquare } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { PageHeader } from '@/components/page-header';
import { PageContainer } from '@/components/page-container';
import { RouteChildPage } from '@/components/route-child-page';
import { Button } from '@/components/ui/button';

import type { RouteChildPageTopic } from './topics.js';

/**
 * What each nested page renders. The three pages differ in their content, not in their structure, so they share
 * this and stay three lines each — the same shape the overlay examples use.
 */
export function ChildPageExample({
  topic,
}: {
  readonly topic: RouteChildPageTopic;
}) {
  const { t } = useTranslation();

  return (
    <>
      <RouteChildPage>
        <PageContainer>
          <PageHeader
            actions={
              topic.overlay ? (
                <Button
                  nativeButton={false}
                  render={<Link to='dialog' />}
                  variant='outline'
                >
                  <MessageSquare />
                  {t('routeOverlays.openTopicDialog')}
                </Button>
              ) : undefined
            }
            description={t(topic.summary)}
            title={t(topic.name)}
          />
          <section className='rounded-xl border bg-muted/30 p-5 md:p-6'>
            <div className='flex items-start gap-3'>
              <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
                <Layers3 className='size-4' />
              </div>
              <p className='text-sm leading-6 text-muted-foreground'>
                {t(
                  topic.overlay
                    ? 'routeOverlays.topicOverlayHint'
                    : 'routeOverlays.topicHint',
                )}
              </p>
            </div>
          </section>
        </PageContainer>
      </RouteChildPage>
      {/* A dialog child route is a layer beside this one, not content inside it. */}
      <Outlet />
    </>
  );
}

ChildPageExample.displayName = 'ChildPageExample';
