/**
 * The system default chat model, at the top of the Models page: the chat model online agents with no models of their
 * own answer with, chosen among the chat models the enabled services offer. With none set, the first one offered is
 * used (and the first one turned on becomes it). Who only reads services sees it, unchangeable.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import type { ModelCatalog, ModelRef } from '../../shared/models.js';
import { agentsKeys } from '../api/keys.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '../components/ui/field.js';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js';
import { Skeleton } from '../components/ui/skeleton.js';
import { useAgentsApi } from '../hooks/use-agents-api.js';
import {
  useDefaultModels,
  useModelCatalog,
} from '../hooks/use-model-catalog.js';
import { useNotify } from '../hooks/use-notify.js';

const SEPARATOR = '\u0000';

/** A chat model as the select holds it. */
const refValue = (ref: ModelRef): string =>
  `${ref.modelService}${SEPARATOR}${ref.model}`;

/** The chat models of the catalog as the select lists them, labelled "service · model". */
function defaultModelItems(
  catalog: Pick<ModelCatalog, 'services'>,
): { readonly value: string; readonly label: string }[] {
  return catalog.services.flatMap((service) =>
    service.models.map((model) => ({
      value: refValue({ modelService: service.name, model: model.value }),
      label: `${service.title} · ${model.label}`,
    })),
  );
}

export function DefaultModelSection({
  canManage,
}: {
  readonly canManage: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const catalog = useModelCatalog();
  const defaults = useDefaultModels();
  const save = useMutation({
    mutationFn: (ref: ModelRef) => api.setDefaultChatModel(ref),
    onSuccess: async (saved) => {
      queryClient.setQueryData(agentsKeys.defaultModels, saved);
      await queryClient.invalidateQueries({ queryKey: agentsKeys.all });
      const chosen = saved.effectiveChat;
      notify.success(
        t('defaultModel.saved', {
          model: chosen ? `${chosen.serviceTitle} · ${chosen.modelLabel}` : '',
        }),
      );
    },
    onError: (error) => notify.error(error),
  });
  const items = catalog.data ? defaultModelItems(catalog.data) : [];
  const effective = defaults.data?.effectiveChat ?? null;
  const id = 'ag-default-chat-model';

  let control: ReactElement;
  if (!catalog.data || !defaults.data)
    control = <Skeleton className='h-8 w-full sm:w-80' />;
  else if (items.length === 0 || !effective)
    control = (
      <p className='text-sm text-muted-foreground sm:max-w-80'>
        {t('defaultModel.none')}
      </p>
    );
  else
    control = (
      <Select
        items={items}
        value={refValue(effective)}
        disabled={!canManage || save.isPending}
        onValueChange={(value: string | null) => {
          if (!value) return;
          const [modelService = '', model = ''] = value.split(SEPARATOR);
          save.mutate({ modelService, model });
        }}
      >
        <SelectTrigger id={id} className='w-full min-w-0 sm:w-80'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
          {catalog.data.services.map((service) => (
            <SelectGroup key={service.name}>
              <SelectLabel>{service.title}</SelectLabel>
              {service.models.map((model) => (
                <SelectItem
                  key={model.value}
                  value={refValue({
                    modelService: service.name,
                    model: model.value,
                  })}
                >
                  {model.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    );

  return (
    <section
      className='rounded-lg border p-4'
      aria-labelledby={`${id}-title`}
      data-testid='ag-default-model'
    >
      <FieldGroup>
        <Field orientation='responsive'>
          <FieldContent>
            <FieldLabel id={`${id}-title`} htmlFor={id}>
              {t('defaultModel.title')}
            </FieldLabel>
            <FieldDescription>{t('defaultModel.description')}</FieldDescription>
          </FieldContent>
          {control}
        </Field>
      </FieldGroup>
    </section>
  );
}
