import { useTranslation } from '@nocobase/i18n/client';
import {
  CheckCheckIcon,
  CopyIcon,
  FileTextIcon,
  RefreshCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';

import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from '@/components/ui/message';
import { Spinner } from '@/components/ui/spinner';

import { ExamplePage, ExampleSection } from '../shared';

export default function MessageExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.message.title')}
      description={t('components.message.description')}
      docs='https://ui.shadcn.com/docs/components/message'
    >
      <ExampleSection
        title={t('components.message.conversation')}
        description={t('components.message.conversationDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-sm flex-col gap-6'>
          <Marker variant='separator'>
            <MarkerContent>{t('reference.yesterday')}</MarkerContent>
          </Marker>
          <Message align='end'>
            <MessageAvatar>
              <Avatar>
                <AvatarFallback>OM</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <Bubble>
                <BubbleContent>
                  {t('components.message.customerAsks', { order: 'ORD-1042' })}
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
          <Message>
            <MessageAvatar>
              <Avatar>
                <AvatarFallback>AC</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <MessageHeader>Ana Costa</MessageHeader>
              <Bubble variant='muted'>
                <BubbleContent>
                  {t('components.message.agentChecking')}
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
          <Marker variant='separator'>
            <MarkerContent>{t('reference.today')}</MarkerContent>
          </Marker>
          <Message>
            <MessageAvatar>
              <Avatar>
                <AvatarFallback>AC</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <MessageHeader>Ana Costa</MessageHeader>
              <BubbleGroup>
                <Bubble variant='muted'>
                  <BubbleContent>
                    {t('components.message.agentShipped', {
                      tracking: '1Z 999 AA1 01 2345 6784',
                    })}
                  </BubbleContent>
                </Bubble>
                <Bubble variant='muted'>
                  <BubbleContent>
                    {t('components.message.agentEta')}
                  </BubbleContent>
                  <BubbleReactions
                    role='img'
                    aria-label={t('components.message.reactionThumbsUp')}
                  >
                    <span>👍</span>
                  </BubbleReactions>
                </Bubble>
              </BubbleGroup>
            </MessageContent>
          </Message>
          <Message align='end'>
            <MessageAvatar>
              <Avatar>
                <AvatarFallback>OM</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <Bubble>
                <BubbleContent>
                  {t('components.message.customerThanks')}
                </BubbleContent>
              </Bubble>
              <MessageFooter>
                <CheckCheckIcon className='size-3.5' aria-hidden='true' />
                {t('components.message.read', { time: '09:47' })}
              </MessageFooter>
            </MessageContent>
          </Message>
          <Marker role='status'>
            <MarkerIcon>
              <Spinner />
            </MarkerIcon>
            <MarkerContent className='shimmer'>
              {t('components.message.typing', { agent: 'Ana' })}
            </MarkerContent>
          </Marker>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.message.group')}
        description={t('components.message.groupDescription')}
        contentClassName='block'
      >
        <MessageGroup className='w-full max-w-sm'>
          <Message>
            <MessageAvatar />
            <MessageContent>
              <Bubble variant='muted'>
                <BubbleContent>
                  {t('components.message.groupFirst')}
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
          <Message>
            <MessageAvatar />
            <MessageContent>
              <Bubble variant='muted'>
                <BubbleContent>
                  {t('components.message.groupSecond')}
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
          <Message>
            <MessageAvatar>
              <Avatar>
                <AvatarFallback>AC</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <Bubble variant='muted'>
                <BubbleContent>
                  {t('components.message.groupThird')}
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        </MessageGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.message.headerFooter')}
        description={t('components.message.headerFooterDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-sm flex-col gap-6'>
          <Message>
            <MessageContent>
              <MessageHeader>
                Ana Costa
                <span className='ml-2 font-normal'>
                  {t('components.message.supportTeam')}
                </span>
              </MessageHeader>
              <Bubble variant='muted'>
                <BubbleContent>
                  {t('components.message.refundOffer')}
                </BubbleContent>
              </Bubble>
              <MessageFooter>09:41</MessageFooter>
            </MessageContent>
          </Message>
          <Message align='end'>
            <MessageContent>
              <Bubble>
                <BubbleContent>
                  {t('components.message.refundAccept')}
                </BubbleContent>
              </Bubble>
              <MessageFooter>
                <CheckCheckIcon className='size-3.5' aria-hidden='true' />
                {t('components.message.read', { time: '09:43' })}
              </MessageFooter>
            </MessageContent>
          </Message>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.message.actions')}
        description={t('components.message.actionsDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-sm flex-col gap-6'>
          <Message>
            <MessageContent>
              <Bubble variant='muted'>
                <BubbleContent>
                  {t('components.message.assistantAnswer')}
                </BubbleContent>
              </Bubble>
              <MessageFooter>
                <Button
                  variant='ghost'
                  size='icon-xs'
                  aria-label={t('reference.copy')}
                >
                  <CopyIcon />
                </Button>
                <Button
                  variant='ghost'
                  size='icon-xs'
                  aria-label={t('components.message.helpful')}
                >
                  <ThumbsUpIcon />
                </Button>
                <Button
                  variant='ghost'
                  size='icon-xs'
                  aria-label={t('components.message.notHelpful')}
                >
                  <ThumbsDownIcon />
                </Button>
              </MessageFooter>
            </MessageContent>
          </Message>
          <Message align='end'>
            <MessageContent>
              <Bubble>
                <BubbleContent>
                  {t('components.message.followUp')}
                </BubbleContent>
              </Bubble>
              <MessageFooter className='gap-2'>
                <span className='font-normal text-destructive'>
                  {t('components.message.failedToSend')}
                </span>
                <Button
                  variant='ghost'
                  size='icon-xs'
                  aria-label={t('components.message.retry')}
                >
                  <RefreshCcwIcon />
                </Button>
              </MessageFooter>
            </MessageContent>
          </Message>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.message.withAttachment')}
        description={t('components.message.withAttachmentDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-sm flex-col gap-6'>
          <Message align='end'>
            <MessageContent>
              <Bubble>
                <BubbleContent>
                  {t('components.message.sendsInvoice')}
                </BubbleContent>
              </Bubble>
              <Attachment size='sm'>
                <AttachmentMedia>
                  <FileTextIcon />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>INV-2041.pdf</AttachmentTitle>
                  <AttachmentDescription>PDF · 184 KB</AttachmentDescription>
                </AttachmentContent>
              </Attachment>
            </MessageContent>
          </Message>
          <Message>
            <MessageContent>
              <Bubble variant='muted'>
                <BubbleContent>
                  {t('components.message.confirmsInvoice')}
                </BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        </div>
      </ExampleSection>
    </ExamplePage>
  );
}
