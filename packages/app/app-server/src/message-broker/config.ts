import {
  validateMessageBrokerConfig,
  type MessageBrokerConfig,
} from '@nocobase/message-broker';
import type { ConfigValidationContext } from '../config/index.js';

export type AppMessageBrokerConfig = MessageBrokerConfig;

/** Pure validation of the merged `messageBroker` section; adapter options are checked by each backend at setup. */
export function validateAppMessageBrokerConfig(
  value: AppMessageBrokerConfig,
  context: ConfigValidationContext,
): void {
  try {
    validateMessageBrokerConfig(value);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    context.error('', error.message);
  }
}
