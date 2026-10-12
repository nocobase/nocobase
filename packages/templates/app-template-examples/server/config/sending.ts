import { defineSendingConfig } from '@nocobase/app-server/sending';
import type { AppConfigFactory } from '@nocobase/app-server/config';
import type { SendingConfig } from '@nocobase/app-server/sending';
const sending: AppConfigFactory<SendingConfig> = defineSendingConfig({
  defaults: () => ({ channels: {} }),
});
export default sending;
