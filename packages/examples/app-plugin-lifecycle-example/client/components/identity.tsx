import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import { PEOPLE, type Role } from '../../shared/people.js';
import { NAMESPACE } from '../lib/format.js';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';

/**
 * Who you are on this page. The example switches between its people so one
 * person can try every role; a real application uses the signed-in user.
 */
export function IdentitySelect({
  value,
  roles,
  onChange,
}: {
  readonly value: string;
  readonly roles: readonly Role[];
  readonly onChange: (id: string) => void;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const people = PEOPLE.filter((person) => roles.includes(person.role));
  const items = people.map((person) => ({
    value: person.id,
    label: `${person.name} · ${person.title}`,
  }));
  return (
    <div className='flex items-center gap-2'>
      <span className='text-sm text-muted-foreground'>
        {t('identity.label')}
      </span>
      <Select
        items={items}
        value={value}
        onValueChange={(next) => {
          if (typeof next === 'string') onChange(next);
        }}
      >
        <SelectTrigger aria-label={t('identity.label')} className='min-w-52'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectGroup key={role}>
              <SelectLabel>{t(`roles.${role}`)}</SelectLabel>
              {people
                .filter((person) => person.role === role)
                .map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name} · {person.title}
                  </SelectItem>
                ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
