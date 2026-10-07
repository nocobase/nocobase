import { useTranslation as useDemoTranslation } from '@nocobase/i18n/client';
import {
  AIChatWindow,
  ChatInline,
  useAIPageElement,
  useAIPageElementPicker,
  type AIChatComposerAction,
} from '../../../registry/nocobase-ai/components/index.js';
import { Badge } from '../../../registry/nocobase-ai/shared/ui/badge.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../registry/nocobase-ai/shared/ui/card.js';
import { Input } from '../../../registry/nocobase-ai/shared/ui/input.js';
import { Label } from '../../../registry/nocobase-ai/shared/ui/label.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../registry/nocobase-ai/shared/ui/select.js';
import {
  AIChatProvider,
  useAIChatBase,
} from '../../../registry/nocobase-ai/providers/index.js';
import { Globe2, MousePointer2 } from 'lucide-react';
import { useMemo, useState } from 'react';

export function PageElementShowcase() {
  return (
    <AIChatProvider id='page-element-demo'>
      <PageElementShowcaseContent />
    </AIChatProvider>
  );
}

function PageElementShowcaseContent() {
  const { t: translateDemo } = useDemoTranslation(
    '@nocobase/app-plugin-ai-employee',
  );

  const { t } = useDemoTranslation('@nocobase/app-plugin-ai-employee');
  const [customerName, setCustomerName] = useState('Northwind Studio');
  const [contactEmail, setContactEmail] = useState('ops@northwind.test');
  const [priority, setPriority] = useState('high');
  const [webSearch, setWebSearch] = useState(false);
  const { id: chatId, addWorkContext, focusComposer } = useAIChatBase();
  const { registeredCount, startPicking } = useAIPageElementPicker();

  const composerActions = useMemo<AIChatComposerAction[]>(
    () => [
      {
        key: 'pick-page-element',
        label: t('actions.pickPageElement', 'Pick page element'),
        icon: <MousePointer2 />,
        disabled: registeredCount === 0,
        onClick: () =>
          startPicking({
            chatId,
            onSelect: (item) => {
              addWorkContext(item);
              focusComposer();
            },
          }),
      },
      {
        key: 'web-search',
        label: t('actions.webSearch', 'Web search'),
        icon: <Globe2 />,
        active: webSearch,
        onClick: () => setWebSearch((active) => !active),
      },
    ],
    [
      addWorkContext,
      chatId,
      focusComposer,
      registeredCount,
      startPicking,
      t,
      webSearch,
    ],
  );

  const formRef = useAIPageElement({
    id: 'customer-intake-form',
    title: translateDemo('demo.customerIntakeForm', {
      defaultValue: 'Customer intake form',
    }),
    kind: 'form',
    getContext: () => ({
      form: 'customer-intake',
      values: { customerName, contactEmail, priority },
    }),
  });
  const detailRef = useAIPageElement({
    id: 'customer-health-summary',
    title: translateDemo('demo.customerHealthSummary', {
      defaultValue: 'Customer health summary',
    }),
    kind: 'record-detail',
    getContext: () => ({
      resource: 'customers',
      record: {
        name: customerName,
        plan: 'Enterprise',
        healthScore: 86,
        openRequests: 3,
        renewalDate: '2026-09-30',
      },
    }),
  });

  return (
    <Card className='gap-0 overflow-hidden py-0'>
      <div className='grid min-h-[560px] lg:grid-cols-[minmax(0,1fr)_390px]'>
        <div className='space-y-4 bg-muted/15 p-4 sm:p-5'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <div className='text-sm font-medium'>
                {translateDemo('demo.customerWorkspace', {
                  defaultValue: 'Customer workspace',
                })}
              </div>
              <div className='text-xs text-muted-foreground'>
                {translateDemo('demo.pageElementsHint', {
                  defaultValue:
                    'The form and detail card are registered page elements.',
                })}
              </div>
            </div>
            <Badge variant='outline'>
              {translateDemo('demo.selectableElements', {
                defaultValue: '2 selectable elements',
              })}
            </Badge>
          </div>

          <Card ref={formRef} className='transition-shadow'>
            <CardHeader>
              <CardTitle>
                {translateDemo('demo.customerIntakeForm', {
                  defaultValue: 'Customer intake form',
                })}
              </CardTitle>
              <p className='text-xs leading-5 text-muted-foreground'>
                {translateDemo('demo.customerFormHint', {
                  defaultValue:
                    'Update a value, then pick this form to capture its current state.',
                })}
              </p>
            </CardHeader>
            <CardContent className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2 sm:col-span-2'>
                <Label htmlFor='page-context-customer-name'>
                  {translateDemo('demo.customerName', {
                    defaultValue: 'Customer name',
                  })}
                </Label>
                <Input
                  id='page-context-customer-name'
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='page-context-contact-email'>
                  {translateDemo('demo.contactEmail', {
                    defaultValue: 'Contact email',
                  })}
                </Label>
                <Input
                  id='page-context-contact-email'
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label>
                  {translateDemo('demo.priority', { defaultValue: 'Priority' })}
                </Label>
                <Select
                  value={priority}
                  onValueChange={(value) => value && setPriority(value)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='low'>
                      {translateDemo('demo.low', { defaultValue: 'Low' })}
                    </SelectItem>
                    <SelectItem value='normal'>
                      {translateDemo('demo.normal', { defaultValue: 'Normal' })}
                    </SelectItem>
                    <SelectItem value='high'>
                      {translateDemo('demo.high', { defaultValue: 'High' })}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card ref={detailRef} className='transition-shadow'>
            <CardHeader>
              <CardTitle>
                {translateDemo('demo.customerHealthSummary', {
                  defaultValue: 'Customer health summary',
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
              {[
                ['Plan', 'Enterprise'],
                ['Health score', '86 / 100'],
                ['Open requests', '3'],
                ['Renewal', 'Sep 30, 2026'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className='rounded-lg border bg-background p-3'
                >
                  <div className='text-xs text-muted-foreground'>{label}</div>
                  <div className='mt-1 text-sm font-medium'>{value}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className='min-h-0 border-t bg-card lg:border-l lg:border-t-0'>
          <ChatInline className='h-[560px] rounded-none border-0'>
            <AIChatWindow
              composerActions={composerActions}
              showConversationToggle={false}
              enableAttachments
              attachmentActionIndex={1}
              disclaimer={false}
            />
          </ChatInline>
        </div>
      </div>
    </Card>
  );
}
