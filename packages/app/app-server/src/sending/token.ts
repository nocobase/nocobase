import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { SendingService, SendingRegistry } from '@nocobase/sending';
export const sendingServiceToken: ServiceToken<SendingService> =
  createServiceToken<SendingService>('@nocobase/sending/service');
export const sendingExtensionRegistryToken: ServiceToken<SendingRegistry> =
  createServiceToken<SendingRegistry>('@nocobase/sending/extensions');
