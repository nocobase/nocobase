import type { ReactElement } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '#components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';

export interface WorkflowVersionOption {
  readonly version: number;
  readonly label: string;
}

export interface WorkflowVersionSelectProps {
  readonly versions: readonly WorkflowVersionOption[];
  readonly value: number | undefined;
  readonly onChange: (version: number | undefined) => void;
  readonly label: string;
  readonly allLabel?: string;
  readonly appearance?: 'field' | 'tag';
}

/** A controlled version viewer; the host owns fetching and URL state. */
export function WorkflowVersionSelect({
  versions,
  value,
  onChange,
  label,
  allLabel,
  appearance = 'tag',
}: WorkflowVersionSelectProps): ReactElement {
  const ordered = [...versions].sort((a, b) => b.version - a.version);
  const latest = ordered[0]?.version;
  const items = [
    ...(allLabel ? [{ value: 'all', label: allLabel }] : []),
    ...ordered.map(({ version, label }) => ({ value: String(version), label })),
  ];
  const selected =
    value === undefined ? (allLabel ? 'all' : String(latest)) : String(value);
  const changeVersion = (next: string | null) =>
    onChange(!next || next === 'all' ? undefined : Number(next));
  if (appearance === 'tag')
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='sm'
              className='inline-flex h-6 max-w-48 items-center rounded-md bg-muted px-2 text-xs font-normal tracking-normal text-foreground'
              aria-label={label}
            />
          }
        >
          <span className='truncate'>
            {items.find((item) => item.value === selected)?.label}
          </span>
          <ChevronDown className='size-3' />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value={selected}
            onValueChange={changeVersion}
          >
            {items.map((item) => (
              <DropdownMenuRadioItem key={item.value} value={item.value}>
                {item.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  return (
    <Select items={items} value={selected} onValueChange={changeVersion}>
      <SelectTrigger
        size='sm'
        className='w-44 font-normal tracking-normal'
        aria-label={label}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
