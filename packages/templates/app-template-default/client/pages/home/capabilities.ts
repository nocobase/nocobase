import {
  Bell,
  CalendarClock,
  Database,
  KeyRound,
  Languages,
  Mail,
  Palette,
  Paperclip,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

/**
 * A built-in capability the homepage introduces. Its title, description and prompts live in the locale files under
 * `home.capabilities.<id>`, one `prompts.<promptId>.label` and `prompts.<promptId>.text` per prompt, so the wording is
 * translated and reworded there rather than here.
 */
export interface Capability {
  readonly id: string;
  readonly icon: LucideIcon;
  readonly prompts: readonly string[];
}

// The default prompts follow the examples in the documentation's Capabilities chapter, in the order of its sidebar.
export const CAPABILITIES: readonly Capability[] = [
  {
    id: 'auth',
    icon: KeyRound,
    prompts: ['disableSignUp', 'companySso', 'apiKeys'],
  },
  {
    id: 'dataSources',
    icon: Database,
    prompts: ['postgres', 'externalDatabase'],
  },
  {
    id: 'authorization',
    icon: ShieldCheck,
    prompts: ['jobs', 'dataScopes', 'restrictions'],
  },
  {
    id: 'workflow',
    icon: Workflow,
    prompts: ['stages', 'backgroundExport', 'history'],
  },
  { id: 'file', icon: Paperclip, prompts: ['attachments', 'avatar'] },
  { id: 'i18n', icon: Languages, prompts: ['addLanguage', 'defaultLanguage'] },
  { id: 'theme', icon: Palette, prompts: ['changeTheme', 'newTheme'] },
  { id: 'notification', icon: Bell, prompts: ['inApp', 'email'] },
  {
    id: 'scheduler',
    icon: CalendarClock,
    prompts: ['reminder', 'weeklyReport'],
  },
  {
    id: 'mail',
    icon: Mail,
    prompts: ['providers', 'mailCenter', 'correspondence'],
  },
];
