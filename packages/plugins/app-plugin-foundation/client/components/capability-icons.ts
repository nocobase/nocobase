import {
  Bell,
  BookOpen,
  Bot,
  Database,
  FileText,
  History,
  KeyRound,
  LayoutGrid,
  Mail,
  Plug,
  Users,
  Workflow,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import type { FoundationCapabilityKey } from '../../shared/foundation.js';

export const CAPABILITY_ICONS: Readonly<
  Record<FoundationCapabilityKey, LucideIcon | undefined>
> = {
  dataModeling: Database,
  files: FileText,
  usersAndOrganizations: Users,
  permissions: KeyRound,
  workflows: Workflow,
  aiAgents: Bot,
  knowledge: BookOpen,
  mail: Mail,
  notifications: Bell,
  integrations: Plug,
  interface: LayoutGrid,
  audit: History,
  operations: Wrench,
};
