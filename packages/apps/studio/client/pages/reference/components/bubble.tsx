import { useTranslation } from '@nocobase/i18n/client';
import { CheckCheckIcon, RefreshCwIcon, ThumbsUpIcon } from 'lucide-react';
import { type ReactElement, useState } from 'react';

import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { ExamplePage, ExampleSection } from '../shared';

type QuickReply = 'invoice' | 'shipping' | 'agent';

const quickReplies: readonly QuickReply[] = ['invoice', 'shipping', 'agent'];

const quickReplyKey: Record<QuickReply, string> = {
  invoice: 'components.bubble.replyInvoice',
  shipping: 'components.bubble.replyShipping',
  agent: 'components.bubble.replyAgent',
};

const quickReplyAnswerKey: Record<QuickReply, string> = {
  invoice: 'components.bubble.answerInvoice',
  shipping: 'components.bubble.answerShipping',
  agent: 'components.bubble.answerAgent',
};

export default function BubbleExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [reply, setReply] = useState<QuickReply | undefined>();

  return (
    <TooltipProvider>
      <ExamplePage
        title={t('components.bubble.title')}
        description={t('components.bubble.description')}
        docs='https://ui.shadcn.com/docs/components/bubble'
      >
        <ExampleSection
          title={t('components.bubble.conversation')}
          description={t('components.bubble.conversationDescription')}
          contentClassName='block'
        >
          <div className='flex w-full max-w-sm flex-col gap-6'>
            <Bubble align='end'>
              <BubbleContent>
                {t('components.bubble.customerAsks', { order: 'ORD-1042' })}
              </BubbleContent>
            </Bubble>
            <BubbleGroup>
              <Bubble variant='muted'>
                <BubbleContent>
                  {t('components.bubble.agentChecking')}
                </BubbleContent>
              </Bubble>
              <Bubble variant='muted'>
                <BubbleContent>
                  {t('components.bubble.agentShipped', {
                    tracking: '1Z 999 AA1 01 2345 6784',
                  })}
                </BubbleContent>
                <BubbleReactions
                  role='img'
                  aria-label={t('components.bubble.reactionThumbsUp')}
                >
                  <span>👍</span>
                </BubbleReactions>
              </Bubble>
            </BubbleGroup>
            <Bubble align='end'>
              <BubbleContent>
                {t('components.bubble.customerThanks')}
              </BubbleContent>
            </Bubble>
          </div>
        </ExampleSection>

        <ExampleSection
          title={t('components.bubble.variants')}
          description={t('components.bubble.variantsDescription')}
          contentClassName='block'
        >
          <div className='flex w-full max-w-sm flex-col gap-4'>
            <Bubble>
              <BubbleContent>
                {t('components.bubble.variantDefault')}
              </BubbleContent>
            </Bubble>
            <Bubble variant='secondary' align='end'>
              <BubbleContent>
                {t('components.bubble.variantSecondary')}
              </BubbleContent>
            </Bubble>
            <Bubble variant='muted'>
              <BubbleContent>
                {t('components.bubble.variantMuted')}
              </BubbleContent>
            </Bubble>
            <Bubble variant='tinted' align='end'>
              <BubbleContent>
                {t('components.bubble.variantTinted')}
              </BubbleContent>
            </Bubble>
            <Bubble variant='outline'>
              <BubbleContent>
                {t('components.bubble.variantOutline')}
              </BubbleContent>
            </Bubble>
            <Bubble variant='destructive' align='end'>
              <BubbleContent>
                {t('components.bubble.variantDestructive')}
              </BubbleContent>
            </Bubble>
            <Bubble variant='ghost'>
              <BubbleContent>
                {t('components.bubble.variantGhost')}
              </BubbleContent>
            </Bubble>
          </div>
        </ExampleSection>

        <ExampleSection
          title={t('components.bubble.reactions')}
          description={t('components.bubble.reactionsDescription')}
          contentClassName='block'
        >
          <div className='flex w-full max-w-sm flex-col gap-10'>
            <Bubble variant='muted'>
              <BubbleContent>
                {t('components.bubble.reactionsMessage')}
              </BubbleContent>
              <BubbleReactions
                role='img'
                aria-label={t('components.bubble.reactionsSummary')}
              >
                <span>👍</span>
                <span>🎉</span>
                <span>👀</span>
                <span>+2</span>
              </BubbleReactions>
            </Bubble>
            <Bubble variant='muted'>
              <BubbleContent>
                {t('components.bubble.reactionsTopMessage')}
              </BubbleContent>
              <BubbleReactions side='top' align='start'>
                <Button
                  variant='secondary'
                  size='icon-xs'
                  aria-label={t('components.bubble.reactionThumbsUp')}
                >
                  <ThumbsUpIcon />
                </Button>
              </BubbleReactions>
            </Bubble>
            <Bubble align='end'>
              <BubbleContent>
                {t('components.bubble.reactionsReadMessage')}
              </BubbleContent>
              <BubbleReactions>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant='ghost'
                        size='icon-xs'
                        aria-label={t('components.bubble.readReceipt')}
                      />
                    }
                  >
                    <CheckCheckIcon />
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('components.bubble.readAt', {
                      time: 'Sep 12, 2026 · 16:32',
                    })}
                  </TooltipContent>
                </Tooltip>
              </BubbleReactions>
            </Bubble>
          </div>
        </ExampleSection>

        <ExampleSection
          title={t('components.bubble.quickReplies')}
          description={t('components.bubble.quickRepliesDescription')}
          contentClassName='block'
        >
          <div className='flex w-full max-w-sm flex-col gap-4'>
            <Bubble variant='muted'>
              <BubbleContent>
                {t('components.bubble.howCanIHelp')}
              </BubbleContent>
            </Bubble>
            {reply ? (
              <>
                <Bubble variant='tinted' align='end'>
                  <BubbleContent>{t(quickReplyKey[reply])}</BubbleContent>
                </Bubble>
                <Bubble variant='muted'>
                  <BubbleContent>{t(quickReplyAnswerKey[reply])}</BubbleContent>
                </Bubble>
                <Button
                  variant='ghost'
                  size='sm'
                  className='self-start'
                  onClick={() => setReply(undefined)}
                >
                  {t('reference.reset')}
                </Button>
              </>
            ) : (
              <BubbleGroup>
                {quickReplies.map((option) => (
                  <Bubble key={option} variant='tinted' align='end'>
                    <BubbleContent
                      render={
                        <button
                          type='button'
                          onClick={() => setReply(option)}
                        />
                      }
                    >
                      {t(quickReplyKey[option])}
                    </BubbleContent>
                  </Bubble>
                ))}
              </BubbleGroup>
            )}
          </div>
        </ExampleSection>

        <ExampleSection
          title={t('components.bubble.richContent')}
          description={t('components.bubble.richContentDescription')}
          contentClassName='block'
        >
          <div className='flex w-full max-w-md flex-col gap-8'>
            <Bubble align='end'>
              <BubbleContent>
                {t('components.bubble.richQuestion')}
              </BubbleContent>
            </Bubble>
            <Bubble variant='ghost'>
              <BubbleContent className='space-y-2'>
                <p>{t('components.bubble.richIntro')}</p>
                <ul className='list-inside list-disc space-y-1'>
                  <li>
                    {t('components.bubble.richStepOne')}{' '}
                    <code className='rounded bg-muted px-1 py-0.5 font-mono text-xs'>
                      pnpm nocobase db apply
                    </code>
                  </li>
                  <li>{t('components.bubble.richStepTwo')}</li>
                  <li>{t('components.bubble.richStepThree')}</li>
                </ul>
              </BubbleContent>
            </Bubble>
            <Bubble variant='destructive' align='end'>
              <BubbleContent>{t('components.bubble.sendFailed')}</BubbleContent>
              <BubbleReactions align='start'>
                <Button
                  variant='secondary'
                  size='icon-xs'
                  aria-label={t('components.bubble.retrySend')}
                >
                  <RefreshCwIcon />
                </Button>
              </BubbleReactions>
            </Bubble>
          </div>
        </ExampleSection>
      </ExamplePage>
    </TooltipProvider>
  );
}
