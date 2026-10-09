// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ComponentType, PropsWithChildren } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import {
  AIProvider,
  type AIProviderProps,
} from '../registry/nocobase-ai/providers/ai-provider.js';
import { useAI } from '../registry/nocobase-ai/providers/ai-context.js';
import { useAIChat } from '../registry/nocobase-ai/providers/chat-context.js';
import { AIChatProvider } from '../registry/nocobase-ai/providers/chat-provider.js';
import type {
  AIEmployee,
  AIModel,
} from '../registry/nocobase-ai/providers/types.js';
import type { AIService } from '../registry/nocobase-ai/services/types.js';

const skillDirectory = '../skills/nocobase-app-plugin-ai-employee/';
// The Skill publishes this example once. It is executed here rather than read,
// because a readiness gate that only looks right is the defect it exists for.
const documents = [
  { path: 'references/chat-surfaces.md', heading: '## The readiness gate' },
];

function readExample(document: (typeof documents)[number]) {
  const markdown = readFileSync(
    resolve(
      dirname(fileURLToPath(import.meta.url)),
      skillDirectory,
      document.path,
    ),
    'utf8',
  );
  const section = markdown
    .split(`${document.heading}\n`)[1]
    ?.split(/\n#{1,2} /)[0];
  const example = section?.match(/```tsx\n([\s\S]*?)\n```/)?.[1];
  if (!example)
    throw new Error(`Missing integration example in ${document.path}`);
  return example;
}

const employee: AIEmployee = { username: 'sales', nickname: 'Sales assistant' };
const model: AIModel = {
  value: 'sales-model',
  label: 'Sales model',
  llmService: 'sales-service',
  configured: true,
};
const configurationRecovery =
  'Check your connection, employee access, and AI settings, then reload this page.';
const modelRecovery =
  'Check and enable a model in AI settings, then reload this page.';
const noModels =
  'No enabled AI model is available. Configure and enable a model in AI settings, then reload this page.';

function createService() {
  const closedStream = () =>
    new ReadableStream<Uint8Array>({
      start: (controller) => controller.close(),
    });
  return {
    listEmployees: vi
      .fn<AIService['listEmployees']>()
      .mockResolvedValue([employee]),
    listModels: vi.fn<AIService['listModels']>().mockResolvedValue([model]),
    updateEmployeeUserPrompt: vi
      .fn<AIService['updateEmployeeUserPrompt']>()
      .mockResolvedValue(undefined),
    listConversations: vi
      .fn<AIService['listConversations']>()
      .mockResolvedValue([]),
    getConversationMessages: vi
      .fn<AIService['getConversationMessages']>()
      .mockResolvedValue([]),
    getConversationActiveState: vi
      .fn<AIService['getConversationActiveState']>()
      .mockResolvedValue('idle'),
    updateConversationTitle: vi
      .fn<AIService['updateConversationTitle']>()
      .mockResolvedValue(undefined),
    destroyConversation: vi
      .fn<AIService['destroyConversation']>()
      .mockResolvedValue(undefined),
    uploadFile: vi.fn<AIService['uploadFile']>(),
    createConversation: vi
      .fn<AIService['createConversation']>()
      .mockResolvedValue('sales-session'),
    sendMessagesStream: vi
      .fn<AIService['sendMessagesStream']>()
      .mockImplementation(async () => closedStream()),
    resendMessagesStream: vi.fn<AIService['resendMessagesStream']>(),
    updateToolCallDecision: vi.fn<AIService['updateToolCallDecision']>(),
    resumeToolCallStream: vi.fn<AIService['resumeToolCallStream']>(),
    resumeConversationStream: vi.fn<AIService['resumeConversationStream']>(),
  } satisfies AIService;
}

// Replace only the large UI surface; keep the real chat, cached transport and
// service calls. Deliberately provide no employee/model selection controls.
function ChatProbe() {
  const chat = useAIChat();
  return (
    <div>
      <input
        aria-label='Message'
        value={chat.draft}
        onChange={(event) => chat.setDraft(event.target.value)}
      />
      <button
        type='button'
        disabled={!chat.canSend}
        onClick={() => void chat.send()}
      >
        Send
      </button>
      <span data-testid='selection'>
        {chat.currentEmployee.username}/{chat.currentModel.value}
      </span>
      <span data-testid='chat-status'>{chat.status}</span>
      {chat.error && <p role='alert'>{chat.error.message}</p>}
    </div>
  );
}

function executeExample(
  source: string,
  service: AIService,
  configuration: Pick<AIProviderProps, 'employees' | 'models'> = {},
) {
  // The root's tool/page-element renderers are unrelated to readiness. Retain
  // its actual AIProvider layer, including asynchronous configuration discovery.
  const extension = {
    AIChatProvider,
    AIChatWindow: ChatProbe,
    ChatInline: ({ children }: PropsWithChildren) => <>{children}</>,
    // Without a `service` the real root talks through the App's API client;
    // this service stands in for it.
    NocoBaseAIRootProvider: (props: AIProviderProps) => (
      <AIProvider service={service} {...props} {...configuration} />
    ),
    useAI,
  };
  const { outputText, diagnostics } = ts.transpileModule(source, {
    fileName: 'sales-chat-page.tsx',
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  expect(diagnostics).toEqual([]);
  const exports: { default?: ComponentType } = {};
  const requireExample = (name: string) => {
    if (name === 'react/jsx-runtime') return jsxRuntime;
    if (name === '#extensions/nocobase-ai') return extension;
    throw new Error(`Unexpected documentation import: ${name}`);
  };
  const evaluate = new Function('require', 'exports', outputText) as (
    require: typeof requireExample,
    exports: { default?: ComponentType },
  ) => void;
  evaluate(requireExample, exports);
  if (!exports.default) throw new Error('Example must export a default page');
  return exports.default;
}

function expectNoChat(service: ReturnType<typeof createService>) {
  expect(
    screen.queryByRole('textbox', { name: 'Message' }),
  ).not.toBeInTheDocument();
  expect(service.listConversations).not.toHaveBeenCalled();
  expect(service.createConversation).not.toHaveBeenCalled();
  expect(service.sendMessagesStream).not.toHaveBeenCalled();
}

describe.each(documents)('issue 6561: $path', (document) => {
  const source = readExample(document);

  it.each(['employees', 'models'] as const)(
    'waits for both lists when %s resolve first, then sends without reselection after load and refresh',
    async (first) => {
      const service = createService();
      const Page = executeExample(source, service);

      // Remount the same page with fresh discovery requests, as on a refresh.
      for (const mount of [1, 2]) {
        const employees = Promise.withResolvers<AIEmployee[]>();
        const models = Promise.withResolvers<AIModel[]>();
        service.listEmployees.mockReturnValueOnce(employees.promise);
        service.listModels.mockReturnValueOnce(models.promise);
        service.listConversations.mockClear();
        service.createConversation.mockClear();
        service.sendMessagesStream.mockClear();
        const view = render(<Page />);

        expect(screen.getByRole('status')).toHaveTextContent(
          'Loading AI configuration...',
        );
        expectNoChat(service);
        expect(service.listEmployees).toHaveBeenCalledTimes(mount);
        expect(service.listModels).toHaveBeenCalledTimes(mount);

        await act(async () => {
          if (first === 'employees') employees.resolve([employee]);
          else models.resolve([model]);
        });
        expect(screen.getByRole('status')).toHaveTextContent(
          'Loading AI configuration...',
        );
        expectNoChat(service);

        await act(async () => {
          employees.resolve([employee]);
          models.resolve([model]);
        });
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.getByTestId('selection')).toHaveTextContent(
          'sales/sales-model',
        );
        expect(service.createConversation).not.toHaveBeenCalled();
        fireEvent.change(screen.getByRole('textbox', { name: 'Message' }), {
          target: { value: 'Review this sale' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Send' }));

        await waitFor(() =>
          expect(service.sendMessagesStream).toHaveBeenCalledTimes(1),
        );
        expect(service.createConversation).toHaveBeenCalledExactlyOnceWith(
          expect.objectContaining({ employee, model }),
        );
        expect(service.sendMessagesStream.mock.calls[0]?.[0]).toMatchObject({
          sessionId: 'sales-session',
          aiEmployee: 'sales',
          model: { llmService: 'sales-service', model: 'sales-model' },
          messages: [
            {
              role: 'user',
              content: { type: 'text', content: 'Review this sale' },
            },
          ],
        });
        await waitFor(() =>
          expect(screen.getByTestId('chat-status')).toHaveTextContent('ready'),
        );
        expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue(
          '',
        );
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        view.unmount();
      }
    },
  );

  it.each([
    {
      name: 'employee loading failure',
      employees: 'reject',
      models: 'ready',
      message: `Access denied ${configurationRecovery}`,
    },
    // Preserve the existing provider contract: empty discovery results are
    // configuration errors, rather than changing runtime semantics for the docs.
    {
      name: 'no accessible employees',
      employees: 'empty',
      models: 'ready',
      message: `No AI employees are available for the current NocoBase user. ${configurationRecovery}`,
    },
    {
      name: 'no enabled models',
      employees: 'ready',
      models: 'empty',
      message: `No enabled AI models were returned by NocoBase. ${modelRecovery}`,
    },
    {
      name: 'model-list failure',
      employees: 'ready',
      models: 'reject',
      message: `Service unavailable ${modelRecovery}`,
    },
    {
      name: 'an unconfigured placeholder model',
      employees: 'ready',
      models: 'placeholder',
      message: noModels,
    },
  ])('does not mount chat for $name', async (scenario) => {
    const service = createService();
    if (scenario.employees === 'reject')
      service.listEmployees.mockRejectedValue(new Error('Access denied'));
    if (scenario.employees === 'empty')
      service.listEmployees.mockResolvedValue([]);
    if (scenario.models === 'reject')
      service.listModels.mockRejectedValue(new Error('Service unavailable'));
    if (scenario.models === 'empty') service.listModels.mockResolvedValue([]);
    if (scenario.models === 'placeholder') {
      service.listModels.mockResolvedValue([
        {
          value: '__unconfigured__',
          label: 'No enabled model',
          configured: false,
        },
      ]);
    }
    const Page = executeExample(source, service);
    render(<Page />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      scenario.message,
    );
    expectNoChat(service);
  });

  it('guards a ready provider with explicitly supplied empty employees', () => {
    const service = createService();
    const Page = executeExample(source, service, {
      employees: [],
      models: [model],
    });
    render(<Page />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No AI employees are available for this user.',
    );
    expectNoChat(service);
  });
});
