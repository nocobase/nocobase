import { useTranslation as useDemoTranslation } from '@nocobase/i18n/client';
import { PageHeader } from '../../components/page-header.js';
import {
  AIChatFloatingTrigger,
  AIChatWindow,
  ChatSurface,
  ChatSurfaceActions,
} from '../../../registry/nocobase-ai/components/index.js';
import { Card } from '../../../registry/nocobase-ai/shared/ui/card.js';
import {
  AIChatProvider,
  useAIChatController,
  useAIChatControllerState,
} from '../../../registry/nocobase-ai/providers/index.js';
import { PromptCard } from './prompt-card.js';
import { AIConfigurationGate } from './configuration-gate.js';
import { useState, type CSSProperties } from 'react';

const floatingPrompt = `Add the standard NocoBase AI floating chat entry to the application layout.

Requirements:
- Render AIChatFloatingTrigger at the lower-right edge of the application.
- Bind it to the global AI chat controller.
- Clicking the trigger opens ChatSurface with variant="side-panel" and a 450px width on the right.
- The side panel must push the desktop page narrower instead of blocking page interaction.
- Mobile may switch to an overlay presentation.
- Hide the floating trigger while the side panel is open.
- Support an unread-count badge.
- Start a new conversation with the configured default AI employee when opened.
- Put ChatSurfaceActions in the AIChatWindow header so expand/collapse and close stay in the upper-right corner.
- Keep one AIChatWindow mounted and change ChatSurface.variant to "dialog" when expanded.
- Keep the trigger and ChatSurface separate from AIChatWindow.
- Use shadcn/Base UI components and the existing AIProvider/AIChatProvider runtime.`;

export function FloatingChatPage() {
  return (
    <AIConfigurationGate>
      <FloatingChatPageContent />
    </AIConfigurationGate>
  );
}

function FloatingChatPageContent() {
  const { t: translateDemo } = useDemoTranslation(
    '@nocobase/app-plugin-ai-employee',
  );

  const { t } = useDemoTranslation('@nocobase/app-plugin-ai-employee');
  const controller = useAIChatController();
  const { open } = useAIChatControllerState(controller);
  const [expanded, setExpanded] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setExpanded(false);
    controller.setOpen(nextOpen);
  };

  return (
    <AIChatProvider id='floating-chat-demo' controller={controller}>
      <div
        data-open={open && !expanded}
        data-chat-side='right'
        className='chat-side-panel-layout @container min-w-0'
        style={
          {
            '--chat-side-panel-width': '450px',
          } as CSSProperties
        }
      >
        <div className='space-y-6'>
          <PageHeader
            title={t('demo.floating.title', 'Floating AI Chat')}
            description={t(
              'demo.floating.description',
              'A global lower-right entry for the shared AI conversation. It opens as a push side panel and can expand into a focused dialog without remounting the chat window.',
            )}
          />

          <section className='space-y-5'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                {t('demo.floating.preview', 'Interactive preview')}
              </p>
              <h2 className='mt-2 text-xl font-semibold tracking-tight'>
                {t(
                  'demo.floating.previewTitle',
                  'Global launcher and adaptive chat surface',
                )}
              </h2>
              <p className='mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground'>
                {t(
                  'demo.floating.previewDescription',
                  'The trigger is constrained to this simulated application in the demo. In production its default positioning is fixed to the viewport.',
                )}
              </p>
            </div>
            <Card className='gap-0 overflow-hidden py-0'>
              <div className='flex h-12 items-center justify-between border-b px-4'>
                <span className='text-sm font-medium'>
                  {t('demo.floating.shell', 'Application shell')}
                </span>
                <code className='rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground'>
                  AIChatFloatingTrigger → ChatSurface · side-panel/dialog
                </code>
              </div>
              <div className='relative grid min-h-[560px] grid-cols-[190px_minmax(0,1fr)] overflow-hidden bg-background'>
                <div className='border-r bg-muted/25 p-4'>
                  <div className='h-7 w-28 rounded bg-muted' />
                  <div className='mt-8 space-y-3'>
                    <div className='h-9 rounded-lg bg-muted' />
                    <div className='h-9 rounded-lg bg-muted/65' />
                    <div className='h-9 rounded-lg bg-muted/65' />
                  </div>
                </div>
                <div className='p-6'>
                  <div className='grid gap-4 sm:grid-cols-3'>
                    <div className='h-28 rounded-xl border bg-muted/15' />
                    <div className='h-28 rounded-xl border bg-muted/15' />
                    <div className='h-28 rounded-xl border bg-muted/15' />
                  </div>
                  <div className='mt-5 h-72 rounded-xl border bg-muted/10' />
                </div>
                <AIChatFloatingTrigger
                  controller={controller}
                  unreadCount={3}
                  position='absolute'
                />
              </div>
            </Card>
          </section>

          <section className='space-y-5'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                {translateDemo('demo.floatingChatPrompt', {
                  defaultValue: 'Floating chat prompt',
                })}
              </p>
              <h2 className='mt-2 text-xl font-semibold tracking-tight'>
                {translateDemo('demo.launcherTitle', {
                  defaultValue: 'Generate the global launcher separately',
                })}
              </h2>
            </div>
            <PromptCard
              title={translateDemo('demo.launcherAction', {
                defaultValue: 'Add a lower-right AI floating entry',
              })}
              description={translateDemo('demo.launcherDescription', {
                defaultValue:
                  'This prompt configures the global trigger and its switchable side-panel/dialog surface.',
              })}
              prompt={floatingPrompt}
            />
          </section>
        </div>
        <ChatSurface
          open={open}
          variant={expanded ? 'dialog' : 'side-panel'}
          onOpenChange={handleOpenChange}
          width={450}
        >
          <AIChatWindow
            headerActions={
              <ChatSurfaceActions
                expanded={expanded}
                onExpandedChange={setExpanded}
                onClose={() => handleOpenChange(false)}
              />
            }
          />
        </ChatSurface>
      </div>
    </AIChatProvider>
  );
}
