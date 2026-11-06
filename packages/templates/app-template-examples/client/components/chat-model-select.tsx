import type { ModelService } from '@nocobase/app-plugin-agents/shared/models';
import type { ComponentProps } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';

type ChatModelSelectProps = Pick<
  ComponentProps<typeof SelectTrigger>,
  'id' | 'ref' | 'onBlur' | 'aria-required' | 'aria-invalid'
> & {
  services: ModelService[];
  value: string | null;
  disabled: boolean;
  placeholder: string;
  onValueChange: (value: string | null) => void;
};

/** Keep model names and provider groups consistent across AI capability pages. */
export function ChatModelSelect({
  services,
  value,
  disabled,
  placeholder,
  onValueChange,
  ...triggerProps
}: ChatModelSelectProps) {
  const groups = services
    .map((service) => ({
      name: service.name,
      title: service.title,
      models: service.models
        .filter((model) => model.kind === 'chat')
        .map((model) => ({
          value: JSON.stringify([service.name, model.value]),
          label: model.label,
        })),
    }))
    .filter((service) => service.models.length > 0);
  return (
    <Select
      items={groups.flatMap((service) => service.models)}
      value={value}
      disabled={disabled}
      onValueChange={onValueChange}
    >
      <SelectTrigger {...triggerProps} className='w-full'>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        {groups.map((service) => (
          <SelectGroup key={service.name}>
            <SelectLabel>{service.title}</SelectLabel>
            {service.models.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
