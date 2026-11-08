export const FEATURE_OVERVIEWS = {
  'app-plugin-api-keys': {
    packageName: '@nocobase/app-plugin-api-keys',
    mode: 'full',
    example: false,
  },
  'app-plugin-authentication': {
    packageName: '@nocobase/app-plugin-authentication',
    mode: 'full',
    example: false,
  },
  'app-plugin-authorization-example': {
    packageName: '@nocobase/app-plugin-authorization-example',
    mode: 'full',
    example: true,
  },
  'app-plugin-cli-example': {
    packageName: '@nocobase/app-plugin-cli-example',
    mode: 'cli',
    example: true,
  },
  'app-plugin-concurrency': {
    packageName: '@nocobase/app-plugin-concurrency',
    mode: 'service',
    example: false,
  },
  'app-plugin-database-example': {
    packageName: '@nocobase/app-plugin-database-example',
    mode: 'service',
    example: true,
  },
  'app-plugin-database-explorer': {
    packageName: '@nocobase/app-plugin-database-explorer',
    mode: 'full',
    example: false,
  },
  'app-plugin-file': {
    packageName: '@nocobase/app-plugin-file',
    mode: 'full',
    example: false,
  },
  'app-plugin-file-example': {
    packageName: '@nocobase/app-plugin-file-example',
    mode: 'full',
    example: true,
  },
  'app-plugin-foundation': {
    packageName: '@nocobase/app-plugin-foundation',
    mode: 'full',
    example: false,
  },
  'app-plugin-jobs-example': {
    packageName: '@nocobase/app-plugin-jobs-example',
    mode: 'full',
    example: true,
  },
  'app-plugin-knowledge': {
    packageName: '@nocobase/app-plugin-knowledge',
    mode: 'full',
    example: false,
  },
  'app-plugin-lifecycle-example': {
    packageName: '@nocobase/app-plugin-lifecycle-example',
    mode: 'full',
    example: true,
  },
  'app-plugin-mail': {
    packageName: '@nocobase/app-plugin-mail',
    mode: 'full',
    example: false,
  },
  'app-plugin-mail-example': {
    packageName: '@nocobase/app-plugin-mail-example',
    mode: 'full',
    example: true,
  },
  'app-plugin-notification': {
    packageName: '@nocobase/app-plugin-notification',
    mode: 'full',
    example: false,
  },
  'app-plugin-notification-example': {
    packageName: '@nocobase/app-plugin-notification-example',
    mode: 'full',
    example: true,
  },
  'app-plugin-notification-in-app': {
    packageName: '@nocobase/app-plugin-notification-in-app',
    mode: 'full',
    example: false,
  },
  'app-plugin-notification-providers': {
    packageName: '@nocobase/app-plugin-notification-providers',
    mode: 'service',
    example: false,
  },
  'app-plugin-office-flows-example': {
    packageName: '@nocobase/app-plugin-office-flows-example',
    mode: 'full',
    example: true,
  },
  'app-plugin-queue-example': {
    packageName: '@nocobase/app-plugin-queue-example',
    mode: 'service',
    example: true,
  },
  'app-plugin-realtime-example': {
    packageName: '@nocobase/app-plugin-realtime-example',
    mode: 'full',
    example: true,
  },
  'app-plugin-repository-example': {
    packageName: '@nocobase/app-plugin-repository-example',
    mode: 'full',
    example: true,
  },
  'app-plugin-routes-example': {
    packageName: '@nocobase/app-plugin-routes-example',
    mode: 'full',
    example: true,
  },
  'app-plugin-scheduler': {
    packageName: '@nocobase/app-plugin-scheduler',
    mode: 'full',
    example: false,
  },
  'app-plugin-service-provider-example': {
    packageName: '@nocobase/app-plugin-service-provider-example',
    mode: 'service',
    example: true,
  },
  'app-plugin-skills-example': {
    packageName: '@nocobase/app-plugin-skills-example',
    mode: 'service',
    example: true,
  },
  'app-plugin-template-print': {
    packageName: '@nocobase/app-plugin-template-print',
    mode: 'reference',
    example: false,
  },
  'app-plugin-template-print-example': {
    packageName: '@nocobase/app-plugin-template-print-example',
    mode: 'full',
    example: true,
  },
  'app-plugin-users': {
    packageName: '@nocobase/app-plugin-users',
    mode: 'full',
    example: false,
  },
  jobs: {
    packageName: '@nocobase/jobs',
    mode: 'core',
    example: false,
  },
  lifecycle: {
    packageName: '@nocobase/lifecycle',
    mode: 'core',
    example: false,
  },
  queue: {
    packageName: '@nocobase/queue',
    mode: 'core',
    example: false,
  },
  realtime: {
    packageName: '@nocobase/realtime',
    mode: 'core',
    example: false,
  },
} as const;

export type FeatureOverviewId = keyof typeof FEATURE_OVERVIEWS;

export interface FeatureOverviewText {
  readonly inspect: string;
  readonly capabilities: readonly [string, string, string];
  readonly configuration: string;
  readonly example: string;
  readonly boundary: string;
  readonly steps: readonly [string, string, string, string];
  readonly prompt: string;
}
