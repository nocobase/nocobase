import {
  Bell,
  GitBranch,
  KeyRound,
  Palette,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Button } from '@/components/ui/button';

import {
  SettingsDialog,
  SettingsDialogSection,
  type SettingsDialogGroup,
} from '@/components/settings-dialog';

const GROUPS: readonly SettingsDialogGroup[] = [
  {
    id: 'account',
    label: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: UserRound },
      { id: 'security', label: 'Security', icon: ShieldCheck },
      { id: 'appearance', label: 'Appearance', icon: Palette },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    items: [
      { id: 'api-keys', label: 'API keys', icon: KeyRound },
      { id: 'git', label: 'Git accounts', icon: GitBranch },
    ],
  },
];

const ITEMS = GROUPS.flatMap((group) => group.items);

const DESCRIPTIONS: Readonly<Record<string, string>> = {
  profile: 'Your name, avatar and email address.',
  security: 'Your password and the sessions signed in as you.',
  appearance: 'The theme and density of the interface.',
  notifications: 'What you hear about, and where.',
  'api-keys': 'Keys that scripts use to act as you.',
  git: 'The Git hosts your work is pushed to.',
};

export function SettingsDialogDemo(): ReactElement {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState('profile');
  const item = ITEMS.find((entry) => entry.id === active) ?? ITEMS[0];
  return (
    <div className='flex h-svh items-start bg-background p-6 text-foreground'>
      <Button variant='outline' onClick={() => setOpen(true)}>
        Open settings
      </Button>
      <SettingsDialog
        open={open}
        onOpenChange={setOpen}
        title='Settings'
        description='Your profile, security, and connected accounts.'
        navigationLabel='Settings categories'
        groups={GROUPS}
        activeId={item.id}
        onSelect={setActive}
      >
        <SettingsDialogSection
          key={item.id}
          title={item.label}
          description={DESCRIPTIONS[item.id]}
        >
          <div className='grid gap-3'>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className='h-16 rounded-lg bg-muted/60' />
            ))}
          </div>
        </SettingsDialogSection>
      </SettingsDialog>
    </div>
  );
}
