import { useId, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';

import { agentsKeys } from '../api/keys.js';
import { Switch } from '../components/ui/switch.js';
import { Button } from '../components/ui/button.js';
import { useNotify } from '../hooks/use-notify.js';

/** Immediately saves membership in an existing defaults list, preserving every other entry and its order. */
export function SkillMountToggle({
  skillId,
  queryKey,
  load,
  save,
  title,
  description,
}: {
  readonly skillId: string;
  readonly queryKey: QueryKey;
  readonly load: () => Promise<readonly string[]>;
  readonly save: (ids: readonly string[]) => Promise<readonly string[]>;
  readonly title: string;
  readonly description: string;
}): ReactElement {
  const { t } = useTranslation();
  const id = useId();
  const notify = useNotify();
  const cache = useQueryClient();
  const list = useQuery({ queryKey, queryFn: load });
  const update = useMutation({
    mutationFn: async (checked: boolean) => {
      const current = await load();
      const next = checked
        ? current.includes(skillId)
          ? current
          : [...current, skillId]
        : current.filter((id) => id !== skillId);
      if (next.length !== current.length) await save(next);
      return load();
    },
    onSuccess: (ids) => {
      cache.setQueryData(queryKey, ids);
      void cache.invalidateQueries({ queryKey: agentsKeys.skill(skillId) });
      notify.success(t('skills.mountSaved'));
    },
    onError: (error) => notify.error(error),
  });
  return (
    <div className='flex items-start justify-between gap-4'>
      <div className='min-w-0'>
        <label htmlFor={id} className='text-sm font-medium'>
          {title}
        </label>
        <p className='text-sm text-muted-foreground'>{description}</p>
        {list.isError ? (
          <Button
            variant='outline'
            size='sm'
            onClick={() => void list.refetch()}
          >
            {t('skills.mountRetry')}
          </Button>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={list.data?.includes(skillId) ?? false}
        disabled={list.isPending || list.isError || update.isPending}
        onCheckedChange={(checked) => update.mutate(checked)}
      />
    </div>
  );
}
