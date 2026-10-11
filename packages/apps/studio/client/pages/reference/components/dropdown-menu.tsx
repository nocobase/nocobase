import { useTranslation } from '@nocobase/i18n/client';
import {
  CopyIcon,
  CreditCardIcon,
  EyeIcon,
  LinkIcon,
  LogOutIcon,
  MailIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SettingsIcon,
  UserPlusIcon,
  UserRoundIcon,
  UsersIcon,
  XCircleIcon,
} from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ExamplePage, ExampleSection } from '../shared';

type SortField = 'name' | 'date' | 'amount';

function isSortField(value: unknown): value is SortField {
  return value === 'name' || value === 'date' || value === 'amount';
}

type ColumnKey = 'status' | 'amount' | 'customer';

const COLUMNS: readonly ColumnKey[] = ['status', 'amount', 'customer'];

export default function DropdownMenuExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [visibleColumns, setVisibleColumns] = useState<
    Record<ColumnKey, boolean>
  >({ status: true, amount: true, customer: false });
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [lastAction, setLastAction] = useState<string | null>(null);

  return (
    <ExamplePage
      title={t('components.dropdownMenu.title')}
      description={t('components.dropdownMenu.description')}
      docs='https://ui.shadcn.com/docs/components/dropdown-menu'
    >
      <ExampleSection
        title={t('components.dropdownMenu.basic')}
        description={t('components.dropdownMenu.basicDescription')}
      >
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant='outline' />}>
            {t('components.dropdownMenu.myAccount')}
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-48'>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Ava Chen</DropdownMenuLabel>
              <DropdownMenuItem>
                {t('reference.profile')}
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                {t('components.dropdownMenu.billing')}
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                {t('reference.settings')}
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                {t('components.dropdownMenu.team')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                {t('components.dropdownMenu.newTeam')}
                <DropdownMenuShortcut>⌘T</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                {t('components.dropdownMenu.support')}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                {t('components.dropdownMenu.apiAccess')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                {t('reference.signOut')}
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ExampleSection>

      <ExampleSection
        title={t('components.dropdownMenu.icons')}
        description={t('components.dropdownMenu.iconsDescription')}
      >
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant='outline' />}>
            <UsersIcon data-icon='inline-start' />
            {t('components.dropdownMenu.team')}
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-52'>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserRoundIcon />
                {t('reference.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon />
                {t('components.dropdownMenu.billing')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon />
                {t('reference.settings')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <UserPlusIcon />
                  {t('components.dropdownMenu.inviteUsers')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className='w-44'>
                  <DropdownMenuItem>
                    <MailIcon />
                    {t('reference.email')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquareIcon />
                    {t('components.dropdownMenu.message')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LinkIcon />
                    {t('components.dropdownMenu.copyInviteLink')}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <LogOutIcon />
                {t('reference.signOut')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ExampleSection>

      <ExampleSection
        title={t('components.dropdownMenu.checkboxes')}
        description={t('components.dropdownMenu.checkboxesDescription')}
      >
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant='outline' />}>
            {t('components.dropdownMenu.columns')}
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-48'>
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {t('components.dropdownMenu.toggleColumns')}
              </DropdownMenuLabel>
              {COLUMNS.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column}
                  checked={visibleColumns[column]}
                  onCheckedChange={(checked) =>
                    setVisibleColumns((current) => ({
                      ...current,
                      [column]: checked,
                    }))
                  }
                >
                  {t(`reference.${column}`)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className='flex flex-wrap gap-2'>
          {COLUMNS.filter((column) => visibleColumns[column]).map((column) => (
            <Badge key={column} variant='secondary'>
              {t(`reference.${column}`)}
            </Badge>
          ))}
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.dropdownMenu.radio')}
        description={t('components.dropdownMenu.radioDescription')}
      >
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant='outline' />}>
            {t('components.dropdownMenu.sortBy')}: {t(`reference.${sortBy}`)}
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-40'>
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {t('components.dropdownMenu.sortBy')}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={sortBy}
                onValueChange={(value: unknown) => {
                  if (isSortField(value)) setSortBy(value);
                }}
              >
                <DropdownMenuRadioItem value='name'>
                  {t('reference.name')}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='date'>
                  {t('reference.date')}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='amount'>
                  {t('reference.amount')}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ExampleSection>

      <ExampleSection
        title={t('components.dropdownMenu.rowActions')}
        description={t('components.dropdownMenu.rowActionsDescription')}
      >
        <div className='flex w-full max-w-md items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3 text-sm'>
          <div className='flex flex-col gap-0.5'>
            <span className='font-mono text-xs text-muted-foreground'>
              ORD-1042
            </span>
            <span className='font-medium'>Ava Chen</span>
          </div>
          <div className='flex items-center gap-3'>
            <Badge variant='secondary'>{t('reference.statusProcessing')}</Badge>
            <span className='font-medium tabular-nums'>$1,240.00</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={t('reference.actions')}
                  />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    {t('reference.actions')}
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() =>
                      setLastAction(t('components.dropdownMenu.viewDetails'))
                    }
                  >
                    <EyeIcon />
                    {t('components.dropdownMenu.viewDetails')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLastAction(t('reference.edit'))}
                  >
                    <PencilIcon />
                    {t('reference.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setLastAction(t('components.dropdownMenu.duplicate'))
                    }
                  >
                    <CopyIcon />
                    {t('components.dropdownMenu.duplicate')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant='destructive'
                    onClick={() =>
                      setLastAction(t('components.dropdownMenu.cancelOrder'))
                    }
                  >
                    <XCircleIcon />
                    {t('components.dropdownMenu.cancelOrder')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <span className='text-sm text-muted-foreground'>
          {lastAction
            ? t('components.dropdownMenu.lastAction', { action: lastAction })
            : t('components.dropdownMenu.noAction')}
        </span>
      </ExampleSection>
    </ExamplePage>
  );
}
