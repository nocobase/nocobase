import { useTranslation } from '@nocobase/i18n/client';
import {
  CreditCardIcon,
  DownloadIcon,
  FileTextIcon,
  PackageIcon,
  PlusIcon,
  ReceiptIcon,
  SettingsIcon,
  UploadIcon,
  UserRoundIcon,
  UsersIcon,
} from 'lucide-react';
import { type ReactElement, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Kbd, KbdGroup } from '@/components/ui/kbd';

import { ExamplePage, ExampleSection } from '../shared';

const TEAM_MEMBERS: readonly string[] = [
  'Ava Chen',
  'Liam Patel',
  'Noah Fischer',
  'Mia Rossi',
  'Ethan Novak',
];

export default function CommandExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [assignee, setAssignee] = useState<string>(TEAM_MEMBERS[0] ?? '');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const runCommand = (label: string): void => {
    setLastCommand(label);
    setOpen(false);
  };

  return (
    <ExamplePage
      title={t('components.command.title')}
      description={t('components.command.description')}
      docs='https://ui.shadcn.com/docs/components/command'
    >
      <ExampleSection
        title={t('components.command.basic')}
        description={t('components.command.basicDescription')}
        contentClassName='block'
      >
        <Command className='w-full max-w-sm rounded-lg border'>
          <CommandInput placeholder={t('components.command.placeholder')} />
          <CommandList>
            <CommandEmpty>{t('components.command.empty')}</CommandEmpty>
            <CommandGroup heading={t('components.command.navigation')}>
              <CommandItem>
                <PackageIcon />
                <span>{t('components.command.orders')}</span>
              </CommandItem>
              <CommandItem>
                <UsersIcon />
                <span>{t('components.command.customers')}</span>
              </CommandItem>
              <CommandItem>
                <ReceiptIcon />
                <span>{t('components.command.invoices')}</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={t('reference.actions')}>
              <CommandItem>
                <PlusIcon />
                <span>{t('components.command.newOrder')}</span>
              </CommandItem>
              <CommandItem>
                <UploadIcon />
                <span>{t('components.command.importCsv')}</span>
              </CommandItem>
              <CommandItem>
                <DownloadIcon />
                <span>{t('components.command.exportReport')}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </ExampleSection>

      <ExampleSection
        title={t('components.command.dialog')}
        description={t('components.command.dialogDescription')}
      >
        <Button variant='outline' onClick={() => setOpen(true)}>
          {t('components.command.openPalette')}
          <KbdGroup data-icon='inline-end'>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
        <span className='text-sm text-muted-foreground'>
          {lastCommand
            ? t('components.command.lastRun', { command: lastCommand })
            : t('components.command.nothingRun')}
        </span>
        <CommandDialog
          open={open}
          onOpenChange={setOpen}
          title={t('components.command.paletteTitle')}
          description={t('components.command.paletteDescription')}
        >
          <Command>
            <CommandInput placeholder={t('components.command.placeholder')} />
            <CommandList>
              <CommandEmpty>{t('components.command.empty')}</CommandEmpty>
              <CommandGroup heading={t('components.command.navigation')}>
                <CommandItem
                  onSelect={() => runCommand(t('components.command.orders'))}
                >
                  <PackageIcon />
                  <span>{t('components.command.orders')}</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(t('components.command.customers'))}
                >
                  <UsersIcon />
                  <span>{t('components.command.customers')}</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(t('components.command.invoices'))}
                >
                  <ReceiptIcon />
                  <span>{t('components.command.invoices')}</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(t('components.command.products'))}
                >
                  <FileTextIcon />
                  <span>{t('components.command.products')}</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading={t('reference.actions')}>
                <CommandItem
                  onSelect={() => runCommand(t('components.command.newOrder'))}
                >
                  <PlusIcon />
                  <span>{t('components.command.newOrder')}</span>
                  <CommandShortcut>⌘N</CommandShortcut>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    runCommand(t('components.command.newCustomer'))
                  }
                >
                  <UserRoundIcon />
                  <span>{t('components.command.newCustomer')}</span>
                  <CommandShortcut>⇧⌘N</CommandShortcut>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    runCommand(t('components.command.exportReport'))
                  }
                >
                  <DownloadIcon />
                  <span>{t('components.command.exportReport')}</span>
                  <CommandShortcut>⌘E</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading={t('reference.settings')}>
                <CommandItem
                  onSelect={() => runCommand(t('reference.profile'))}
                >
                  <UserRoundIcon />
                  <span>{t('reference.profile')}</span>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(t('components.command.billing'))}
                >
                  <CreditCardIcon />
                  <span>{t('components.command.billing')}</span>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(t('reference.settings'))}
                >
                  <SettingsIcon />
                  <span>{t('reference.settings')}</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
      </ExampleSection>

      <ExampleSection
        title={t('components.command.shortcuts')}
        description={t('components.command.shortcutsDescription')}
        contentClassName='block'
      >
        <Command className='w-full max-w-sm rounded-lg border'>
          <CommandInput placeholder={t('components.command.placeholder')} />
          <CommandList>
            <CommandEmpty>{t('components.command.empty')}</CommandEmpty>
            <CommandGroup heading={t('reference.actions')}>
              <CommandItem>
                <PlusIcon />
                <span>{t('components.command.newOrder')}</span>
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <DownloadIcon />
                <span>{t('components.command.exportReport')}</span>
                <CommandShortcut>⌘E</CommandShortcut>
              </CommandItem>
              <CommandItem disabled>
                <UploadIcon />
                <span>{t('components.command.importCsv')}</span>
                <CommandShortcut>⌘I</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={t('reference.settings')}>
              <CommandItem>
                <UserRoundIcon />
                <span>{t('reference.profile')}</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <SettingsIcon />
                <span>{t('reference.settings')}</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </ExampleSection>

      <ExampleSection
        title={t('components.command.selection')}
        description={t('components.command.selectionDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-sm flex-col gap-3'>
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-muted-foreground'>
              {t('components.command.assignedTo')}
            </span>
            <Badge variant='secondary'>{assignee}</Badge>
          </div>
          <Command className='rounded-lg border'>
            <CommandInput placeholder={t('components.command.searchMembers')} />
            <CommandList>
              <CommandEmpty>{t('components.command.empty')}</CommandEmpty>
              <CommandGroup heading={t('components.command.team')}>
                {TEAM_MEMBERS.map((member) => (
                  <CommandItem
                    key={member}
                    data-checked={member === assignee}
                    onSelect={() => setAssignee(member)}
                  >
                    <UserRoundIcon />
                    <span>{member}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </ExampleSection>
    </ExamplePage>
  );
}
