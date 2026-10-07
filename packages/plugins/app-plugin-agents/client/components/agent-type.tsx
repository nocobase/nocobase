/**
 * What the agent pages show of an agent's type: the Online / Runner tag, the type choice of the new-agent dialog, the
 * model service and model selects of an online agent's entry, whose options come from the server's model catalog
 * (`GET agents/admin/models`), and what an online agent that lists no model answers with: the system default chat
 * model (`GET agents/defaultModels`), with the way to the Models page to change it.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { MessageSquareIcon, WrenchIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { AGENT_TYPES, type AgentType } from '../../shared/agents.js';
import type { ModelCatalog } from '../../shared/models.js';
import {
  useDefaultModels,
  useDefaultModelText,
} from '../hooks/use-model-catalog.js';
import { AgTag } from './ag-tag.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from './ui/field.js';
import { RadioGroup, RadioGroupItem } from './ui/radio-group.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';

/** A small Online / Runner tag. */
export function AgentTypeTag({
  type,
}: {
  readonly type: AgentType;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <AgTag tone={type === 'online' ? 'violet' : 'blue'}>
      {type === 'online' ? <MessageSquareIcon /> : <WrenchIcon />}
      {t(`agentTypes.${type}`)}
    </AgTag>
  );
}

/** The new-agent dialog's first question: an online agent or a runner agent. */
export function AgentTypePicker({
  value,
  onChange,
}: {
  readonly value: AgentType;
  readonly onChange: (type: AgentType) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <RadioGroup
      aria-label={t('agentTypes.label')}
      value={value}
      className='grid-cols-1 sm:grid-cols-2'
      onValueChange={(next) => {
        const type = AGENT_TYPES.find((candidate) => candidate === next);
        if (type) onChange(type);
      }}
    >
      {(['online', 'runner'] as const).map((type) => (
        <FieldLabel key={type} htmlFor={`ag-agent-type-${type}`}>
          <Field orientation='horizontal'>
            <FieldContent>
              <FieldTitle>
                {type === 'online' ? <MessageSquareIcon /> : <WrenchIcon />}
                {t(`agentTypes.${type}`)}
              </FieldTitle>
              <FieldDescription>{t(`agentTypes.${type}Hint`)}</FieldDescription>
            </FieldContent>
            <RadioGroupItem value={type} id={`ag-agent-type-${type}`} />
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  );
}

/**
 * What an online agent that lists no model answers with: the system default chat model, with a link to change it on
 * the Models page; or, while no service offers a chat model, that it needs one, with a link to set one up.
 */
export function DefaultModelNote(): ReactElement | null {
  const { t } = useTranslation();
  const defaults = useDefaultModels();
  const model = useDefaultModelText();
  if (!defaults.data) return null;
  return (
    <FieldDescription data-testid='ag-default-model-note'>
      <span>
        {model
          ? t('agents.usesDefaultModel', { model })
          : t('agentForm.noModels')}
      </span>{' '}
      <Link to='/models' className='underline underline-offset-4'>
        {model ? t('agents.changeDefaultModel') : t('agents.setUpModels')}
      </Link>
    </FieldDescription>
  );
}

/** What online agents need and is missing: no model service offers a model yet. */
export function NoModels(): ReactElement {
  const { t } = useTranslation();
  return <FieldDescription>{t('agentForm.noModels')}</FieldDescription>;
}

/**
 * The model service and model selects of a row of the tools-and-models list, labelled for assistive technology only
 * (the list's header names the columns); a model no longer offered stays listed so it shows.
 */
export function ModelFields({
  idPrefix,
  catalog,
  modelService,
  model,
  disabled,
  onChange,
}: {
  readonly idPrefix: string;
  readonly catalog: ModelCatalog | undefined;
  readonly modelService: string;
  readonly model: string;
  readonly disabled?: boolean;
  readonly onChange: (modelService: string, model: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  const services = catalog?.services ?? [];
  const serviceItems = [
    ...services.map((service) => ({
      value: service.name,
      label: service.title,
    })),
    ...(modelService &&
    !services.some((service) => service.name === modelService)
      ? [{ value: modelService, label: modelService }]
      : []),
  ];
  const offered =
    services.find((service) => service.name === modelService)?.models ?? [];
  const modelItems = [
    ...offered.map((option) => ({ value: option.value, label: option.label })),
    ...(model && !offered.some((option) => option.value === model)
      ? [{ value: model, label: model }]
      : []),
  ];
  return (
    <>
      <Select
        items={serviceItems}
        value={modelService || null}
        disabled={disabled}
        onValueChange={(next: string | null) => {
          const first =
            services.find((service) => service.name === next)?.models[0]
              ?.value ?? '';
          onChange(next ?? '', first);
        }}
      >
        <SelectTrigger
          id={`${idPrefix}-service`}
          aria-label={t('agentForm.modelService')}
          className='w-full'
        >
          <SelectValue placeholder={t('agentForm.chooseService')} />
        </SelectTrigger>
        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
          {serviceItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={modelItems}
        value={model || null}
        disabled={disabled || !modelService}
        onValueChange={(next: string | null) =>
          onChange(modelService, next ?? '')
        }
      >
        <SelectTrigger
          id={`${idPrefix}-model`}
          aria-label={t('agentForm.model')}
          className='w-full'
        >
          <SelectValue placeholder={t('agentForm.chooseModel')} />
        </SelectTrigger>
        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
          {modelItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
