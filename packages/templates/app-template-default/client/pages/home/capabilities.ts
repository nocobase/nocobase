import {
  Bell,
  CalendarClock,
  KeyRound,
  Languages,
  Mail,
  Palette,
  Paperclip,
  Printer,
  ShieldCheck,
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

// The default prompts follow the examples in the documentation's Capabilities chapter.
export const CAPABILITIES: readonly Capability[] = [
  {
    id: 'auth',
    icon: KeyRound,
    prompts: ['disableSignUp', 'passwordRules', 'companySso'],
  },
  {
    id: 'authorization',
    icon: ShieldCheck,
    prompts: ['jobs', 'dataScopes', 'sharing'],
  },
  {
    id: 'scheduler',
    icon: CalendarClock,
    prompts: ['reminder', 'weeklyReport'],
  },
  { id: 'notification', icon: Bell, prompts: ['inApp', 'email'] },
  {
    id: 'mail',
    icon: Mail,
    prompts: ['mailCenter', 'correspondence'],
  },
  { id: 'file', icon: Paperclip, prompts: ['attachments', 'avatar'] },
  { id: 'templatePrint', icon: Printer, prompts: ['approvalForm', 'pdf'] },
  { id: 'i18n', icon: Languages, prompts: ['addLanguage', 'defaultLanguage'] },
  { id: 'theme', icon: Palette, prompts: ['changeTheme', 'newTheme'] },
];
