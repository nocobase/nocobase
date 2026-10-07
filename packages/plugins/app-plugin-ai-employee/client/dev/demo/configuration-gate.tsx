import { useTranslation } from '@nocobase/i18n/client';
import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../../registry/nocobase-ai/shared/ui/alert.js';
import {
  AIProvider,
  useAI,
  type AIEmployee,
  type AIModel,
} from '../../../registry/nocobase-ai/providers/index.js';
import type { AIService } from '../../../registry/nocobase-ai/services/index.js';

const previewEmployees: AIEmployee[] = [
  {
    username: 'atlas',
    nickname: 'Atlas',
    position: 'General assistant',
    greeting: 'How can I help with this page?',
  },
  {
    username: 'viz',
    nickname: 'Viz',
    position: 'Insights analyst',
    greeting: 'What would you like to explore?',
  },
];

const previewModels: AIModel[] = [
  {
    value: '__preview__',
    label: 'Preview only',
    configured: false,
  },
];

const emptyStream = () =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.close();
    },
  });

const previewService: AIService = {
  listEmployees: async () => previewEmployees,
  listModels: async () => previewModels,
  updateEmployeeUserPrompt: async () => undefined,
  listConversations: async () => [],
  getConversationMessages: async () => [],
  getConversationActiveState: async () => 'idle',
  updateConversationTitle: async () => undefined,
  destroyConversation: async () => undefined,
  uploadFile: async (file) => ({
    id: crypto.randomUUID(),
    filename: file.name,
    mimetype: file.type,
    size: file.size,
  }),
  createConversation: async () => `preview-${crypto.randomUUID()}`,
  sendMessagesStream: async () => emptyStream(),
  resendMessagesStream: async () => emptyStream(),
  updateToolCallDecision: async () => ({ updated: 0, toolCalls: [] }),
  resumeToolCallStream: async () => emptyStream(),
  resumeConversationStream: async () => emptyStream(),
};

export function AIConfigurationGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const { configurationStatus, hasEnabledModels, employees } = useAI();
  const configured =
    configurationStatus === 'ready' && hasEnabledModels && employees.length > 0;

  if (configured) return children;

  const content = employees.length ? (
    children
  ) : (
    <AIProvider
      employees={previewEmployees}
      models={previewModels}
      service={previewService}
    >
      {children}
    </AIProvider>
  );

  return (
    <div className='space-y-6'>
      <Alert>
        <CircleAlert />
        <AlertTitle>
          {t('demo.configuration.previewTitle', 'Preview mode')}
        </AlertTitle>
        <AlertDescription>
          {t(
            'demo.configuration.previewDescription',
            'Component examples remain available. Sending messages requires an enabled AI model in the connected NocoBase application.',
          )}
        </AlertDescription>
      </Alert>
      {content}
    </div>
  );
}
