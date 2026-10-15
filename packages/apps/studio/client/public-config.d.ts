import '@nocobase/app-client';

declare module '@nocobase/app-client' {
  interface PublicAppConfig {
    agents: { runs?: { retentionDays?: number } };
  }
}
