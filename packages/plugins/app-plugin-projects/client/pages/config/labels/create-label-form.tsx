import { useTranslation } from '@nocobase/i18n/client';
import { PlusIcon } from 'lucide-react';
import { type FormEvent, type ReactElement, useState } from 'react';

import type { Color } from '../../../../shared/common.js';
import { LABEL_NAME_MAX } from '../../../../shared/labels.js';
import { PmColorSwatches, PmLabelDot } from '../../../components/pm-labels.js';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import { Spinner } from '../../../components/ui/spinner.js';

/** A name and a colour for a new label. */
export function CreateLabelForm({
  pending,
  onCreate,
}: {
  readonly pending: boolean;
  readonly onCreate: (input: { name: string; color: Color }) => void;
}): ReactElement {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [color, setColor] = useState<Color>('gray');

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ name: trimmed, color });
    setName('');
  };

  return (
    <form
      onSubmit={submit}
      className='flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3'
    >
      <PmLabelDot color={color} className='size-3' />
      <Input
        value={name}
        maxLength={LABEL_NAME_MAX}
        placeholder={t('config.labels.namePlaceholder')}
        aria-label={t('config.labels.newName')}
        className='w-56'
        onChange={(event) => setName(event.target.value)}
      />
      <PmColorSwatches
        value={color}
        label={t('config.labels.newColor')}
        onChange={setColor}
      />
      <Button type='submit' disabled={pending || !name.trim()}>
        {pending ? (
          <Spinner data-icon='inline-start' />
        ) : (
          <PlusIcon data-icon='inline-start' />
        )}
        {t('config.labels.create')}
      </Button>
    </form>
  );
}
