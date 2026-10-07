/**
 * "Start from" on the new-agent dialog: a blank agent or a preset role the application registered. A preset only
 * fills the form (description, instructions, business actions, and the name while it is empty); everything stays
 * editable, and the agent is like any other once created.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import type { AgentPreset } from '../../../shared/presets.js';
import { chatKeys } from '../../chat/keys.js';
import { useChatApi } from '../../chat/use-chat.js';
import { useText } from '../../hooks/use-vocabulary.js';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '../../components/ui/field.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.js';

const BLANK = '__blank__';

export function PresetPicker({
  value,
  onChange,
}: {
  /** The preset key, or null for a blank agent. */
  readonly value: string | null;
  readonly onChange: (
    preset: AgentPreset | null,
    name: string,
    description: string,
  ) => void;
}): ReactElement | null {
  const { t } = useTranslation();
  const text = useText();
  const api = useChatApi();
  const presets = useQuery({
    queryKey: chatKeys.presets,
    queryFn: () => api.presets(),
    staleTime: 5 * 60_000,
  });
  if (!presets.data || presets.data.length === 0) return null;
  const nameOf = (preset: AgentPreset): string =>
    text(preset.nameText, preset.name);
  const descriptionOf = (preset: AgentPreset): string =>
    text(preset.descriptionText, preset.description);
  const items = [
    { value: BLANK, label: t('agentPresets.blank') },
    ...presets.data.map((preset) => ({
      value: preset.key,
      label: nameOf(preset),
    })),
  ];
  const chosen = presets.data.find((preset) => preset.key === value) ?? null;
  return (
    <Field>
      <FieldLabel htmlFor='ag-agent-preset'>
        {t('agentPresets.label')}
      </FieldLabel>
      <Select
        items={items}
        value={value ?? BLANK}
        onValueChange={(next: string | null) => {
          const preset =
            presets.data.find((candidate) => candidate.key === next) ?? null;
          onChange(
            preset,
            preset ? nameOf(preset) : '',
            preset ? descriptionOf(preset) : '',
          );
        }}
      >
        <SelectTrigger id='ag-agent-preset' className='w-full'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>
        {chosen ? descriptionOf(chosen) : t('agentPresets.hint')}
      </FieldDescription>
    </Field>
  );
}
