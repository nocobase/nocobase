import { AppSwitcher } from './app-switcher.js';
export interface AppBrandProps {
  readonly compact?: boolean;
}
export function AppBrand({ compact = false }: AppBrandProps) {
  return <AppSwitcher compact={compact} />;
}
