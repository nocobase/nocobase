import {
  createContext,
  type Context,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ModuleDescriptor } from '../shared/types.js';

export interface ModuleNavigationItem {
  readonly path: string;
  readonly title: string;
  readonly icon: LucideIcon;
  readonly end?: boolean;
}

export interface ModuleLayoutProps {
  readonly module: ModuleDescriptor;
  readonly navigation: readonly ModuleNavigationItem[];
  readonly children: ReactNode;
}

// The App supplies its shell components; business plugins own their identity and menu.
export type ModuleLayoutRenderer = (props: ModuleLayoutProps) => ReactElement;

const ModuleLayoutHostContext: Context<ModuleLayoutRenderer | null> =
  createContext<ModuleLayoutRenderer | null>(null);

export { ModuleLayoutHostContext as ModuleLayoutHost };
