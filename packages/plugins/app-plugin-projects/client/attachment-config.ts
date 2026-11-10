import { useClientApplication } from '@nocobase/app-client';

declare module '@nocobase/app-client' {
  interface PublicAppConfig {
    projects: { attachments?: { maxFileSizeMb?: number } };
  }
}

/** The server publishes this deployment limit with the public application configuration. */
export function useProjectsAttachmentMaxFileSizeMb(): number {
  const app = useClientApplication();
  return app.config.public.get('projects.attachments.maxFileSizeMb', 20);
}
