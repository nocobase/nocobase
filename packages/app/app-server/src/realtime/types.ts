import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type {
  RealtimePrincipal,
  RealtimeService,
} from '@nocobase/realtime/server';

export * from '@nocobase/realtime/server';

export interface RealtimePrincipalResolver {
  resolve(request: Request): Promise<RealtimePrincipal | undefined>;
}

export const realtimeServiceToken: ServiceToken<RealtimeService> =
  createServiceToken<RealtimeService>('@nocobase/app/realtime-service');

export const realtimePrincipalResolverToken: ServiceToken<RealtimePrincipalResolver> =
  createServiceToken<RealtimePrincipalResolver>(
    '@nocobase/app/realtime-principal-resolver',
  );
