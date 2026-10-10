import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowDownToLineIcon,
  ArrowUpToLineIcon,
  RotateCcwIcon,
} from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Marker, MarkerContent } from '@/components/ui/marker';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from '@/components/ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
} from '@/components/ui/message-scroller';

import { ExamplePage, ExampleSection } from '../shared';

type Sender = 'customer' | 'agent';

interface ChatItem {
  readonly id: string;
  readonly kind: 'message' | 'marker';
  readonly sender?: Sender;
  readonly textKey: string;
}

const initialThread: readonly ChatItem[] = [
  { id: 'm1', kind: 'marker', textKey: 'reference.yesterday' },
  {
    id: 'm2',
    kind: 'message',
    sender: 'customer',
    textKey: 'components.messageScroller.customerReport',
  },
  {
    id: 'm3',
    kind: 'message',
    sender: 'agent',
    textKey: 'components.messageScroller.agentAck',
  },
  {
    id: 'm4',
    kind: 'message',
    sender: 'customer',
    textKey: 'components.messageScroller.customerDetails',
  },
  {
    id: 'm5',
    kind: 'message',
    sender: 'agent',
    textKey: 'components.messageScroller.agentInvestigating',
  },
  { id: 'm6', kind: 'marker', textKey: 'reference.today' },
  {
    id: 'm7',
    kind: 'message',
    sender: 'agent',
    textKey: 'components.messageScroller.agentFound',
  },
  {
    id: 'm8',
    kind: 'message',
    sender: 'customer',
    textKey: 'components.messageScroller.customerConfirm',
  },
];

/** Replies the append button cycles through, so the thread keeps growing realistically. */
const appendedReplies: readonly Pick<ChatItem, 'sender' | 'textKey'>[] = [
  { sender: 'agent', textKey: 'components.messageScroller.appendAgentFix' },
  {
    sender: 'customer',
    textKey: 'components.messageScroller.appendCustomerThanks',
  },
  { sender: 'agent', textKey: 'components.messageScroller.appendAgentClose' },
  {
    sender: 'customer',
    textKey: 'components.messageScroller.appendCustomerFollowUp',
  },
];

const transcript: readonly ChatItem[] = [
  {
    id: 't1',
    kind: 'marker',
    textKey: 'components.messageScroller.ticketOpened',
  },
  {
    id: 't2',
    kind: 'message',
    sender: 'customer',
    textKey: 'components.messageScroller.customerReport',
  },
  {
    id: 't3',
    kind: 'message',
    sender: 'agent',
    textKey: 'components.messageScroller.agentAck',
  },
  {
    id: 't4',
    kind: 'message',
    sender: 'customer',
    textKey: 'components.messageScroller.customerDetails',
  },
  {
    id: 't5',
    kind: 'message',
    sender: 'agent',
    textKey: 'components.messageScroller.agentInvestigating',
  },
  {
    id: 't6',
    kind: 'message',
    sender: 'agent',
    textKey: 'components.messageScroller.agentFound',
  },
  {
    id: 't7',
    kind: 'message',
    sender: 'customer',
    textKey: 'components.messageScroller.customerConfirm',
  },
  {
    id: 't8',
    kind: 'message',
    sender: 'agent',
    textKey: 'components.messageScroller.appendAgentFix',
  },
  {
    id: 't9',
    kind: 'message',
    sender: 'customer',
    textKey: 'components.messageScroller.appendCustomerThanks',
  },
  {
    id: 't10',
    kind: 'marker',
    textKey: 'components.messageScroller.ticketClosed',
  },
];

function ThreadItem({ item }: { readonly item: ChatItem }): ReactElement {
  const { t } = useTranslation();

  if (item.kind === 'marker') {
    return (
      <MessageScrollerItem messageId={item.id}>
        <Marker variant='separator'>
          <MarkerContent>{t(item.textKey)}</MarkerContent>
        </Marker>
      </MessageScrollerItem>
    );
  }

  const fromCustomer = item.sender === 'customer';

  // The customer's turn is the anchor: when a new one lands, the viewport
  // settles on it instead of snapping to the very bottom.
  return (
    <MessageScrollerItem messageId={item.id} scrollAnchor={fromCustomer}>
      <Message align={fromCustomer ? 'end' : 'start'}>
        <MessageAvatar>
          <Avatar size='sm'>
            <AvatarFallback>{fromCustomer ? 'OM' : 'AC'}</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          {fromCustomer ? null : <MessageHeader>Ana Costa</MessageHeader>}
          <Bubble variant={fromCustomer ? 'default' : 'muted'}>
            <BubbleContent>{t(item.textKey)}</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

/** Header controls that read scroll state through the provider hooks. */
function TranscriptControls(): ReactElement {
  const { t } = useTranslation();
  const { scrollToStart, scrollToEnd } = useMessageScroller();
  const scrollable = useMessageScrollerScrollable();

  return (
    <div className='flex items-center gap-1'>
      <Button
        variant='outline'
        size='icon-sm'
        aria-label={t('components.messageScroller.jumpToStart')}
        disabled={!scrollable.start}
        onClick={() => scrollToStart({ behavior: 'smooth' })}
      >
        <ArrowUpToLineIcon />
      </Button>
      <Button
        variant='outline'
        size='icon-sm'
        aria-label={t('components.messageScroller.jumpToEnd')}
        disabled={!scrollable.end}
        onClick={() => scrollToEnd({ behavior: 'smooth' })}
      >
        <ArrowDownToLineIcon />
      </Button>
    </div>
  );
}

export default function MessageScrollerExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [thread, setThread] = useState<readonly ChatItem[]>(initialThread);
  const [appended, setAppended] = useState(0);

  const appendMessage = (): void => {
    const reply = appendedReplies[appended % appendedReplies.length];
    if (!reply) return;
    setThread((previous) => [
      ...previous,
      { id: `appended-${appended}`, kind: 'message', ...reply },
    ]);
    setAppended((count) => count + 1);
  };

  const resetThread = (): void => {
    setThread(initialThread);
    setAppended(0);
  };

  return (
    <ExamplePage
      title={t('components.messageScroller.title')}
      description={t('components.messageScroller.description')}
      docs='https://ui.shadcn.com/docs/components/message-scroller'
    >
      <ExampleSection
        title={t('components.messageScroller.liveThread')}
        description={t('components.messageScroller.liveThreadDescription')}
        contentClassName='block'
      >
        <MessageScrollerProvider>
          <Card className='mx-auto h-112 w-full max-w-sm gap-0'>
            <CardHeader className='gap-1 border-b'>
              <CardTitle>
                {t('components.messageScroller.ticketTitle', {
                  ticket: 'TCK-3081',
                })}
              </CardTitle>
              <CardDescription>
                {t('components.messageScroller.ticketSubject')}
              </CardDescription>
              <CardAction>
                <Button
                  variant='outline'
                  size='icon-sm'
                  aria-label={t('reference.reset')}
                  disabled={appended === 0}
                  onClick={resetThread}
                >
                  <RotateCcwIcon />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className='min-h-0 flex-1 p-0'>
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent className='gap-4 p-(--card-spacing)'>
                    {thread.map((item) => (
                      <ThreadItem key={item.id} item={item} />
                    ))}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton
                  aria-label={t('components.messageScroller.scrollToLatest')}
                />
              </MessageScroller>
            </CardContent>
            <CardFooter className='flex-col items-stretch gap-2 border-t'>
              <Button variant='secondary' onClick={appendMessage}>
                {t('components.messageScroller.appendMessage')}
              </Button>
              <p className='text-center text-xs text-muted-foreground'>
                {t('components.messageScroller.appendHint')}
              </p>
            </CardFooter>
          </Card>
        </MessageScrollerProvider>
      </ExampleSection>

      <ExampleSection
        title={t('components.messageScroller.savedTranscript')}
        description={t('components.messageScroller.savedTranscriptDescription')}
        contentClassName='block'
      >
        <MessageScrollerProvider
          defaultScrollPosition='start'
          autoScroll={false}
        >
          <Card className='mx-auto h-96 w-full max-w-sm gap-0'>
            <CardHeader className='gap-1 border-b'>
              <CardTitle>
                {t('components.messageScroller.ticketTitle', {
                  ticket: 'TCK-2977',
                })}
              </CardTitle>
              <CardDescription>
                {t('components.messageScroller.closedTranscript')}
              </CardDescription>
              <CardAction>
                <TranscriptControls />
              </CardAction>
            </CardHeader>
            <CardContent className='min-h-0 flex-1 p-0'>
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent className='gap-4 p-(--card-spacing)'>
                    {transcript.map((item) => (
                      <ThreadItem key={item.id} item={item} />
                    ))}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton
                  aria-label={t('components.messageScroller.scrollToLatest')}
                />
              </MessageScroller>
            </CardContent>
          </Card>
        </MessageScrollerProvider>
      </ExampleSection>

      <ExampleSection
        title={t('components.messageScroller.compact')}
        description={t('components.messageScroller.compactDescription')}
        contentClassName='block'
      >
        <MessageScrollerProvider>
          <MessageScroller className='mx-auto h-64 w-full max-w-sm rounded-lg border bg-background'>
            <MessageScrollerViewport
              aria-label={t('components.messageScroller.ticketSubject')}
            >
              <MessageScrollerContent className='gap-4 p-4'>
                {initialThread.map((item) => (
                  <ThreadItem key={item.id} item={item} />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton
              direction='start'
              aria-label={t('components.messageScroller.jumpToStart')}
            />
            <MessageScrollerButton
              aria-label={t('components.messageScroller.scrollToLatest')}
            />
          </MessageScroller>
        </MessageScrollerProvider>
      </ExampleSection>
    </ExamplePage>
  );
}
