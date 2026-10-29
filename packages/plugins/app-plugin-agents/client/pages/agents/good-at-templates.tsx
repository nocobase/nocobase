import { useTranslation } from '@nocobase/i18n/client';
import { useRef, useState, type ReactElement } from 'react';
import { ChevronDownIcon } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu.js';
import { Button } from '../../components/ui/button.js';

const TEMPLATES = [
  'design',
  'large',
  'review',
  'routine',
  'small',
  'explanation',
] as const;

/** Shared by adding models and editing agents; choosing a template changes only the draft. */
export function GoodAtTemplates({
  value,
  onChange,
  disabled = false,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const [previous, setPrevious] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <div className='flex shrink-0 items-center gap-1'>
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={triggerRef}
          disabled={disabled}
          render={<Button type='button' variant='ghost' size='xs' />}
        >
          {t('goodAtTemplates.fill')}
          <ChevronDownIcon data-icon='inline-end' />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          className='w-56 max-w-(--available-width)'
        >
          <DropdownMenuGroup>
            {TEMPLATES.map((key) => (
              <DropdownMenuItem
                key={key}
                disabled={disabled}
                onClick={() => {
                  setPrevious(value);
                  onChange(t(`modelSuggestions.${key}`));
                }}
              >
                {t(`goodAtTemplates.${key}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {previous !== null ? (
        <Button
          type='button'
          variant='ghost'
          size='xs'
          disabled={disabled}
          onClick={() => {
            onChange(previous);
            setPrevious(null);
            triggerRef.current?.focus();
          }}
        >
          {t('goodAtTemplates.undo')}
        </Button>
      ) : null}
    </div>
  );
}
