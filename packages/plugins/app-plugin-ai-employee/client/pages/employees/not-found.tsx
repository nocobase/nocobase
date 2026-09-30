import type { ReactElement } from 'react';
import { useT } from '../../locales/index.js';

export default function EmployeeTabNotFoundPage(): ReactElement {
  const t = useT();
  return (
    <p role='alert' className='text-sm text-destructive'>
      {t('Employee settings tab not found.')}
    </p>
  );
}
