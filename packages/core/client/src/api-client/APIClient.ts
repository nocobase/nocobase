import { APIClient as APIClientSDK } from '@nocobase/sdk';
import { Result } from 'ahooks/lib/useRequest/src/types';

export class APIClient extends APIClientSDK {
  services: Record<string, Result<any, any>>;
}
