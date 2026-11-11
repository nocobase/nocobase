import { AppSwitcher as PlatformAppSwitcher } from '@nocobase/app-plugin-platform-sso/client';
import { useClientApplication } from '@nocobase/app-client';
import { AppIcon } from './app-icon.js';
import metadata from '../../../package.json' with { type: 'json' };
export function AppSwitcher(props: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const app = useClientApplication();
  return (
    <PlatformAppSwitcher
      {...props}
      name={app.config.get<string>('app.title') || metadata.name}
      template={metadata.name.replace(/^app-template-/, '')}
      renderIcon={(template) => <AppIcon template={template} />}
    />
  );
}
