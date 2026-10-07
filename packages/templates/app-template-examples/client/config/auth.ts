import { defineAppConfig, type AppConfigFactory } from '@nocobase/app-client';
import { apiKeyClient } from '@nocobase/app-plugin-api-keys/client';
import type { AuthConfig } from '@nocobase/app-plugin-authentication/client';
import {
  deviceAuthorizationClient,
  usernameClient,
} from 'better-auth/client/plugins';

const auth: AppConfigFactory<AuthConfig> = defineAppConfig((_runtime) => ({
  // `deviceAuthorizationClient()` serves the `/device` page (`pages/auth/device.tsx`), where people approve a CLI's sign-in.
  plugins: [
    usernameClient({ displayUsername: false }),
    apiKeyClient(),
    deviceAuthorizationClient(),
  ],
}));

export default auth;
