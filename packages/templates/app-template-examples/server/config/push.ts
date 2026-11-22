import { pushConfig, type PushConfig } from '@nocobase/app-plugin-notification-web-push/server';
import type { AppConfigFactory } from '@nocobase/app-server/config';

/** Browser push: `WEB_PUSH_PRIVATE_KEY` (generated into `.env` when missing) and `WEB_PUSH_CONTACT`. */
const push: AppConfigFactory<PushConfig> = pushConfig;

export default push;
