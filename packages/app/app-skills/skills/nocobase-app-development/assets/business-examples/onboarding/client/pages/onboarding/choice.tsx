import { useTranslation } from '@nocobase/i18n/client';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '#components/ui/select';
export function Choice({
  label,
  value,
  options,
  onChange,
  disabled,
  selectedName,
}: {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  selectedName?: string;
}) {
  const { t } = useTranslation();
  const choices = [
    { value: '__empty', label: t('onboarding.select') },
    ...options.map((o) => ({ value: o.id, label: o.name })),
  ];
  const items = [...choices];
  if (value && !options.some((o) => o.id === value))
    items.push({ value, label: selectedName || value });
  return (
    <Select
      value={value || '__empty'}
      items={items}
      onValueChange={(v) => onChange(v === '__empty' ? '' : String(v ?? ''))}
      disabled={disabled}
    >
      <SelectTrigger aria-label={label} className='w-full'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {choices.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
