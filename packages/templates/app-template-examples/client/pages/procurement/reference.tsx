import { useEffect, useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { useListData } from '#hooks/use-list-data';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '#components/ui/select';

export interface Candidate {
  id: string;
  name: string;
  unitPrice?: string;
}
export function Choice({
  label,
  value,
  options,
  onChange,
  disabled,
  selectedName,
}: {
  selectedName?: string;
  label: string;
  value: string;
  options: Candidate[];
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const items = options.map((o) => ({ value: o.id || '__all', label: o.name }));
  // Retain the saved reference label even when a search no longer includes it.
  if (value && !options.some((o) => o.id === value))
    items.push({ value, label: selectedName || value });
  return (
    <Select
      value={value || '__all'}
      items={items}
      onValueChange={(v) => onChange(v === '__all' ? '' : String(v ?? ''))}
      disabled={disabled}
    >
      <SelectTrigger aria-label={label} className='w-full'>
        <SelectValue placeholder={t('procurement.select')} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.id || '__all'} value={o.id || '__all'}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function Reference({
  kind,
  label,
  value,
  onChange,
  disabled,
  selectedName,
}: {
  selectedName?: string;
  kind: 'suppliers' | 'materials' | 'reviewers';
  label: string;
  value: string;
  onChange: (id: string, option?: Candidate) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [active, setActive] = useState('true');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setQuery(q), 250);
    return () => clearTimeout(timer);
  }, [q]);
  const request = useListData<{ data: Candidate[] }>(
    `procurement/candidates?${new URLSearchParams({ kind, q: query, active })}`,
    { active: !disabled },
  );
  return (
    <div className='min-w-0 space-y-2'>
      {!disabled ? (
        <>
          <Input
            aria-label={t('procurement.searchReference', { kind: label })}
            placeholder={t('procurement.searchReference', { kind: label })}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {kind !== 'reviewers' ? (
            <Choice
              label={`${label} ${t('procurement.availability')}`}
              value={active}
              onChange={setActive}
              options={[
                { id: 'true', name: t('procurement.active') },
                { id: 'false', name: t('procurement.inactive') },
              ]}
            />
          ) : null}
        </>
      ) : null}
      <Choice
        label={label}
        selectedName={selectedName}
        value={value}
        options={[
          { id: '', name: t('procurement.select') },
          ...(request.data?.data ?? []),
        ]}
        disabled={disabled || q !== query || request.loading}
        onChange={(id) =>
          onChange(
            id,
            request.data?.data.find((o) => o.id === id),
          )
        }
      />
      {request.error ? (
        <p role='alert' className='text-sm text-destructive'>
          {t('procurement.failed')}
        </p>
      ) : null}
    </div>
  );
}
