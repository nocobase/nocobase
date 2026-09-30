import { ChevronDown, MessageCircleQuestion, ShieldCheck } from 'lucide-react';
import type { ReactElement } from 'react';
import { Button } from './ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';
import { useT } from '../locales/index.js';

export type ToolPermission = 'ASK' | 'ALLOW';

/** Chooses whether a tool asks before each call or runs without asking; shared by employee and MCP tool settings. */
export function ToolPermissionMenu({
  value,
  label,
  accessibleLabel,
  disabled,
  onChange,
}: {
  value: ToolPermission;
  /** Replaces the visible value, for a permission that is not yet known. */
  label?: string;
  accessibleLabel: string;
  disabled: boolean;
  onChange: (permission: ToolPermission) => void;
}): ReactElement {
  const t = useT();
  const Icon = value === 'ALLOW' ? ShieldCheck : MessageCircleQuestion;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant='outline' size='sm' />}
        disabled={disabled}
        aria-label={accessibleLabel}
        className='min-w-28 justify-between'
      >
        <Icon data-icon='inline-start' aria-hidden='true' />
        {label ?? (value === 'ALLOW' ? t('Allow') : t('Ask'))}
        <ChevronDown data-icon='inline-end' aria-hidden='true' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next: unknown) => {
            if ((next === 'ASK' || next === 'ALLOW') && next !== value)
              onChange(next);
          }}
        >
          <DropdownMenuRadioItem value='ASK' closeOnClick>
            <MessageCircleQuestion aria-hidden='true' />
            {t('Ask')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='ALLOW' closeOnClick>
            <ShieldCheck aria-hidden='true' />
            {t('Allow')}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
