import { useClientApplication } from '@nocobase/app-client';

declare module '@nocobase/app-client' {
  interface PublicAppConfig {
    agents: { conversations?: { attachmentMaxFileSizeMb?: number } };
  }
}

/** The server publishes this deployment limit with the public application configuration. */
export function useAgentsAttachmentMaxFileSizeMb(): number {
  const app = useClientApplication();
  return app.config.public.get(
    'agents.conversations.attachmentMaxFileSizeMb',
    20,
  );
}
