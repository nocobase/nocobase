import { GeneralSettings } from '@nocobase/app-plugin-projects/client/config';
import {
  canUseSetting,
  SectionHeading,
  SettingsPageHeader,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { studioKeys, useStudioApi } from '../../access/api.js';
import { useNotify } from '../../access/notify.js';
import { roleTitle } from './members/roles-model.js';

const NONE = '__none__';

/**
 * The role someone who becomes a member is given once, on their first visit or when they accept an invitation; "none"
 * leaves them without any until someone assigns one. It can be taken away later like any other.
 */
function DefaultRoleSection(): ReactElement | null {
  const { t } = useTranslation();
  const api = useStudioApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const viewer = useViewer();
  const canEdit = canUseSetting(viewer, 'pm.general', 'update');
  const canReadRoles = canUseSetting(viewer, 'pm.members', 'read');
  const settings = useQuery({
    queryKey: studioKeys.settings,
    queryFn: () => api.settings(),
  });
  const roles = useQuery({
    queryKey: studioKeys.roles,
    queryFn: () => api.roles(),
    enabled: canReadRoles,
  });
  const save = useMutation({
    mutationFn: (defaultRole: string | null) =>
      api.updateSettings({ defaultRole }),
    onSuccess: (next) => {
      queryClient.setQueryData(studioKeys.settings, next);
      notify.success(t('config.defaultRole.saved'));
    },
    onError: (error) => notify.error(error),
  });
  if (!settings.data) return null;
  const current = settings.data.defaultRole ?? NONE;
  const items = [
    { value: NONE, label: t('config.defaultRole.none') },
    ...(roles.data ?? [])
      .filter((role) => role.key !== 'owner')
      .map((role) => ({ value: role.key, label: roleTitle(t, role) })),
  ];
  if (!items.some((item) => item.value === current))
    items.push({ value: current, label: current });
  return (
    <section className='space-y-4' aria-labelledby='studio-default-role'>
      <SectionHeading
        id='studio-default-role'
        title={t('config.defaultRole.title')}
        description={t('config.defaultRole.description')}
      />
      <Select
        items={items}
        value={current}
        disabled={!canEdit || save.isPending}
        onValueChange={(value: string | null) => {
          if (value && value !== current)
            save.mutate(value === NONE ? null : value);
        }}
      >
        <SelectTrigger
          className='w-64'
          aria-label={t('config.defaultRole.title')}
        >
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
    </section>
  );
}

/** `/config/general`: the issue prefix (the projects plugin's), and the default role for new members. */
export default function GeneralConfigPage(): ReactElement {
  const { t } = useTranslation();
  const canEdit = canUseSetting(useViewer(), 'pm.general', 'update');
  return (
    <section className='space-y-4' aria-labelledby='studio-config-general'>
      <SettingsPageHeader
        id='studio-config-general'
        title={t('config.nav.general')}
        description={t('config.general.description')}
        readOnly={!canEdit}
      />
      <div className='space-y-10 pt-2'>
        <GeneralSettings />
        <DefaultRoleSection />
      </div>
    </section>
  );
}
