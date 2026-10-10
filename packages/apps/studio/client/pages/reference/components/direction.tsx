import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowRightIcon,
  ChevronRightIcon,
  MailIcon,
  SearchIcon,
  UserPlusIcon,
} from 'lucide-react';
import { type ReactElement, type ReactNode, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DirectionProvider, useDirection } from '@/components/ui/direction';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Switch } from '@/components/ui/switch';

import { ExamplePage, ExampleSection } from '../shared';

type Direction = 'ltr' | 'rtl';

interface DirectionPanelProps {
  readonly direction: Direction;
  readonly children: ReactNode;
}

/**
 * `DirectionProvider` tells Base UI which way keyboard navigation and popup
 * alignment run; the `dir` attribute is what flips the layout itself. A real
 * application sets both once, on the document, from the active locale.
 */
function DirectionPanel({
  direction,
  children,
}: DirectionPanelProps): ReactElement {
  const { t } = useTranslation();
  return (
    <DirectionProvider direction={direction}>
      <div
        dir={direction}
        className='flex flex-col gap-4 rounded-lg border bg-background p-4'
      >
        <div className='flex items-center justify-between gap-2'>
          <span className='text-sm font-medium'>
            {t(`components.direction.${direction}`)}
          </span>
          <DirectionBadge />
        </div>
        {children}
      </div>
    </DirectionProvider>
  );
}

function DirectionBadge(): ReactElement {
  const { t } = useTranslation();
  const direction = useDirection();
  return (
    <Badge variant='outline' className='font-mono'>
      {t('components.direction.current', { direction })}
    </Badge>
  );
}

function SampleForm(): ReactElement {
  const { t } = useTranslation();
  const [notify, setNotify] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>{t('reference.search')}</FieldLabel>
        <InputGroup>
          <InputGroupInput
            placeholder={t('components.direction.searchPlaceholder')}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </Field>
      <Field orientation='horizontal'>
        <Checkbox
          checked={notify}
          onCheckedChange={(checked) => setNotify(checked)}
        />
        <FieldContent>
          <FieldLabel>{t('components.direction.notifyByEmail')}</FieldLabel>
          <FieldDescription>
            {t('components.direction.notifyByEmailHint')}
          </FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation='horizontal'>
        <FieldContent>
          <FieldLabel>{t('components.direction.twoFactor')}</FieldLabel>
          <FieldDescription>
            {t('components.direction.twoFactorHint')}
          </FieldDescription>
        </FieldContent>
        <Switch
          checked={twoFactor}
          onCheckedChange={(checked) => setTwoFactor(checked)}
        />
      </Field>
      <div className='flex items-center gap-2'>
        <Button variant='outline'>{t('reference.cancel')}</Button>
        <Button className='ms-auto'>
          {t('components.direction.continue')}
          <ArrowRightIcon data-icon='inline-end' className='rtl:rotate-180' />
        </Button>
      </div>
    </FieldGroup>
  );
}

function SampleMenu(): ReactElement {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='outline' />}>
        <UserPlusIcon data-icon='inline-start' />
        {t('components.direction.invite')}
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-48'>
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {t('components.direction.invite')}
          </DropdownMenuLabel>
          <DropdownMenuItem>
            <MailIcon />
            {t('components.direction.inviteByEmail')}
          </DropdownMenuItem>
          <DropdownMenuItem>
            {t('components.direction.inviteByLink')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {t('components.direction.assignRole')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>
              {t('components.direction.roleViewer')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              {t('components.direction.roleEditor')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              {t('components.direction.roleAdmin')}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DirectionExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.direction.title')}
      description={t('components.direction.description')}
      docs='https://ui.shadcn.com/docs/components/direction'
    >
      <ExampleSection
        title={t('components.direction.sideBySide')}
        description={t('components.direction.sideBySideDescription')}
        contentClassName='grid gap-4 sm:grid-cols-2 items-start'
      >
        <DirectionPanel direction='ltr'>
          <SampleForm />
        </DirectionPanel>
        <DirectionPanel direction='rtl'>
          <SampleForm />
        </DirectionPanel>
      </ExampleSection>

      <ExampleSection
        title={t('components.direction.menus')}
        description={t('components.direction.menusDescription')}
        contentClassName='grid gap-4 sm:grid-cols-2 items-start'
      >
        <DirectionPanel direction='ltr'>
          <SampleMenu />
        </DirectionPanel>
        <DirectionPanel direction='rtl'>
          <SampleMenu />
        </DirectionPanel>
      </ExampleSection>

      <ExampleSection
        title={t('components.direction.logical')}
        description={t('components.direction.logicalDescription')}
        contentClassName='grid gap-4 sm:grid-cols-2 items-start'
      >
        {(['ltr', 'rtl'] as const).map((direction) => (
          <DirectionPanel key={direction} direction={direction}>
            <ul className='divide-y text-sm'>
              {[
                {
                  number: 'ORD-1042',
                  customer: 'Ava Chen',
                  total: '$1,240.00',
                },
                {
                  number: 'ORD-1041',
                  customer: 'Liam Patel',
                  total: '$389.50',
                },
                {
                  number: 'ORD-1040',
                  customer: 'Noah Fischer',
                  total: '$2,150.00',
                },
              ].map((order) => (
                <li
                  key={order.number}
                  className='flex items-center gap-3 py-2 ps-3 text-start border-s-2 border-primary/40'
                >
                  <span className='font-mono text-xs text-muted-foreground'>
                    {order.number}
                  </span>
                  <span className='font-medium'>{order.customer}</span>
                  <span className='ms-auto tabular-nums'>{order.total}</span>
                  <ChevronRightIcon className='size-4 text-muted-foreground rtl:rotate-180' />
                </li>
              ))}
            </ul>
            <p className='text-xs text-muted-foreground'>
              {t('components.direction.logicalHint')}
            </p>
          </DirectionPanel>
        ))}
      </ExampleSection>
    </ExamplePage>
  );
}
