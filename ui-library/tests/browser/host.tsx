/** Independent Registry host: real generic components, plugin controller and HTTP client. */
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ServiceContainer } from '@nocobase/service-provider';
import {
  ClientApplicationContext,
  apiClientToken,
  realtimeClientToken,
  createApiClient,
  type ClientApplication,
} from '@nocobase/app-client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { ChatProvider } from '@nocobase/app-plugin-agents/client/chat';
import { FixtureConversation } from './conversation';
import enUS from '../../registry/agents/agent-chat/locales/en-US';
import '../../website/styles.css';

const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/registry-browser-fixture',
    resources: enUS,
  },
});
const services = new ServiceContainer();
services.instance(
  apiClientToken,
  createApiClient({ baseURL: `${location.origin}/api` }),
);
// No realtime server is needed: this host exercises explicit HTTP/history and first SSE only.
services.instance(realtimeClientToken, {
  subscribe: () => () => {},
  onOpen: () => () => {},
} as never);
const app = { services } as unknown as ClientApplication;
createRoot(document.getElementById('root')!).render(
  <ClientApplicationContext.Provider value={app}>
    <TestI18nProvider runtime={runtime}>
      <BrowserRouter>
        <ChatProvider>
          <FixtureConversation />
        </ChatProvider>
      </BrowserRouter>
    </TestI18nProvider>
  </ClientApplicationContext.Provider>,
);
