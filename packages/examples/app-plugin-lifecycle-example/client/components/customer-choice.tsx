import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import { PEOPLE } from '../../shared/people.js';
import { NAMESPACE } from '../lib/format.js';
import { Choice } from './choice.js';

const CUSTOMERS = PEOPLE.filter((person) => person.role === 'customer');

/** Who a record is for: one of the example's customers, as data. */
export function CustomerChoice({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  return (
    <div className='space-y-1.5'>
      <span className='text-sm'>{t('flows.customer')}</span>
      <Choice
        label={t('flows.customer')}
        className='w-full'
        value={value}
        onChange={onChange}
        options={CUSTOMERS.map((customer) => ({
          value: customer.id,
          label: `${customer.name} · ${customer.title}`,
        }))}
      />
    </div>
  );
}
