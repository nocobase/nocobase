import type { ReactNode } from 'react';
import { PlatformLogin as PlatformSignIn } from '@nocobase/app-plugin-platform-sso/client';
import { useClientApplication } from '@nocobase/app-client';
import { AppIcon } from '../../layouts/components/app-icon.js';
import metadata from '../../../package.json' with { type: 'json' };
export default function PlatformLogin({ local }: { local: ReactNode }) {
  const app = useClientApplication();
  return (
    <PlatformSignIn
      local={local}
      name={app.config.get<string>('app.title') || metadata.name}
      icon={<AppIcon template={metadata.name.replace(/^app-template-/, '')} />}
    />
  );
}
