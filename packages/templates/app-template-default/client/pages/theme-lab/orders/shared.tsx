import { useTranslation } from '@nocobase/i18n/client';
import { StatusBadge } from '#components/status-badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import type { OrderStatus } from './data';
export function OrderBadge({ status }: { readonly status: OrderStatus }) {
  const { t } = useTranslation();
  return (
    <StatusBadge
      tone={
        status === 'completed'
          ? 'success'
          : status === 'processing'
            ? 'info'
            : 'neutral'
      }
    >
      {t(`businessPreview.${status}`)}
    </StatusBadge>
  );
}
export function PreviewSelect({
  value,
  options,
  onChange,
  label,
  id,
}: {
  readonly value: string;
  readonly options: { value: string; label: string }[];
  readonly onChange: (value: string) => void;
  readonly label: string;
  readonly id?: string;
}) {
  return (
    <Select
      value={value}
      items={options}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
    >
      <SelectTrigger id={id} aria-label={label} className='w-full'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        <SelectGroup>
          {options.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
