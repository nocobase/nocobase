import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowRightLeftIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  FileTextIcon,
  RotateCcwIcon,
  TagIcon,
  UserPlusIcon,
} from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker';
import { Message, MessageContent } from '@/components/ui/message';
import { Spinner } from '@/components/ui/spinner';

import { ExamplePage, ExampleSection } from '../shared';

export default function MarkerExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [reopened, setReopened] = useState(false);

  return (
    <ExamplePage
      title={t('components.marker.title')}
      description={t('components.marker.description')}
      docs='https://ui.shadcn.com/docs/components/marker'
    >
      <ExampleSection
        title={t('components.marker.basic')}
        description={t('components.marker.basicDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-sm flex-col gap-4'>
          <Marker>
            <MarkerIcon>
              <UserPlusIcon />
            </MarkerIcon>
            <MarkerContent>
              {t('components.marker.assigned', { agent: 'Ana Costa' })}
            </MarkerContent>
          </Marker>
          <Marker>
            <MarkerIcon>
              <TagIcon />
            </MarkerIcon>
            <MarkerContent>
              {t('components.marker.tagged', { tag: 'billing' })}
            </MarkerContent>
          </Marker>
          <Marker>
            <MarkerIcon>
              <ArrowRightLeftIcon />
            </MarkerIcon>
            <MarkerContent>
              {t('components.marker.priorityChanged', {
                from: t('reference.priorityMedium'),
                to: t('reference.priorityHigh'),
              })}
            </MarkerContent>
          </Marker>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.marker.variants')}
        description={t('components.marker.variantsDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-sm flex-col gap-6'>
          <Marker>
            <MarkerContent>
              {t('components.marker.variantDefault')}
            </MarkerContent>
          </Marker>
          <Marker variant='separator'>
            <MarkerContent>
              {t('components.marker.variantSeparator')}
            </MarkerContent>
          </Marker>
          <Marker variant='border'>
            <MarkerContent>
              {t('components.marker.variantBorder')}
            </MarkerContent>
          </Marker>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.marker.status')}
        description={t('components.marker.statusDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-sm flex-col gap-6'>
          <Marker role='status'>
            <MarkerIcon>
              <Spinner />
            </MarkerIcon>
            <MarkerContent className='shimmer'>
              {t('components.marker.agentTyping', { agent: 'Ana' })}
            </MarkerContent>
          </Marker>
          <Marker variant='separator' role='status'>
            <MarkerIcon>
              <Spinner />
            </MarkerIcon>
            <MarkerContent>
              {t('components.marker.syncingOrders')}
            </MarkerContent>
          </Marker>
          <Marker role='status'>
            <MarkerIcon>
              <CheckCircle2Icon />
            </MarkerIcon>
            <MarkerContent>
              {t('components.marker.syncComplete', { count: 24 })}
            </MarkerContent>
          </Marker>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.marker.inConversation')}
        description={t('components.marker.inConversationDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-sm flex-col gap-4'>
          <Marker variant='separator'>
            <MarkerContent>{t('reference.yesterday')}</MarkerContent>
          </Marker>
          <Message align='end'>
            <MessageContent>
              <Bubble>
                <BubbleContent>
                  {t('components.marker.customerAsks')}
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
          <Marker variant='separator'>
            <MarkerContent>{t('reference.today')}</MarkerContent>
          </Marker>
          <Marker>
            <MarkerIcon>
              <UserPlusIcon />
            </MarkerIcon>
            <MarkerContent>
              {t('components.marker.joined', { agent: 'Ana Costa' })}
            </MarkerContent>
          </Marker>
          <Message>
            <MessageContent>
              <Bubble variant='muted'>
                <BubbleContent>
                  {t('components.marker.agentReplies')}
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.marker.activityLog')}
        description={t('components.marker.activityLogDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-sm flex-col gap-3'>
          <Marker variant='border'>
            <MarkerIcon>
              <FileTextIcon />
            </MarkerIcon>
            <MarkerContent>
              {t('components.marker.invoiceCreated', { invoice: 'INV-2041' })}
            </MarkerContent>
          </Marker>
          <Marker variant='border'>
            <MarkerIcon>
              <ArrowRightLeftIcon />
            </MarkerIcon>
            <MarkerContent>
              {t('components.marker.statusChanged', {
                from: t('reference.statusDraft'),
                to: t('reference.statusPending'),
              })}
            </MarkerContent>
          </Marker>
          <Marker variant='border'>
            <MarkerIcon>
              <CheckCircle2Icon />
            </MarkerIcon>
            <MarkerContent>
              {t('components.marker.paymentReceived', { amount: '$1,240.00' })}
            </MarkerContent>
          </Marker>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.marker.interactive')}
        description={t('components.marker.interactiveDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-sm flex-col gap-4'>
          <Marker
            render={
              <a
                href='https://ui.shadcn.com/docs/components/marker'
                target='_blank'
                rel='noreferrer'
              />
            }
          >
            <MarkerIcon>
              <ExternalLinkIcon />
            </MarkerIcon>
            <MarkerContent>{t('components.marker.viewTicket')}</MarkerContent>
          </Marker>
          <Marker
            render={
              <button
                type='button'
                className='transition-colors hover:text-foreground'
                onClick={() => setReopened((value) => !value)}
              />
            }
          >
            <MarkerIcon>
              <RotateCcwIcon />
            </MarkerIcon>
            <MarkerContent>
              {reopened
                ? t('components.marker.ticketReopened')
                : t('components.marker.reopenTicket')}
            </MarkerContent>
          </Marker>
        </div>
      </ExampleSection>
    </ExamplePage>
  );
}
