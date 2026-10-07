import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import {
  AI_EMPLOYEE_EXAMPLE_EMPLOYEE,
  AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL,
} from '../../shared/contracts.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';

export default function AIEmployeeTasksFallbackPage(): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee-example');

  return (
    <PageContainer className='max-w-4xl'>
      <PageHeader
        title={t('fallback.title')}
        description={t('fallback.description')}
      />
      <section className='space-y-3 rounded-xl border bg-card p-6 text-card-foreground'>
        <h2 className='text-base font-semibold'>{t('fallback.stepsTitle')}</h2>
        <ol className='list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground'>
          <li>{t('fallback.chatStep')}</li>
          <li>{t('fallback.pageStep')}</li>
        </ol>
      </section>
      <section className='space-y-2 rounded-xl border bg-card p-6 text-card-foreground'>
        <h2 className='text-base font-semibold'>
          {t('fallback.employeeTitle')}
        </h2>
        <p className='text-sm leading-6 text-muted-foreground'>
          {t('fallback.employee', {
            employee: AI_EMPLOYEE_EXAMPLE_EMPLOYEE,
            tool: AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL,
          })}
        </p>
      </section>
    </PageContainer>
  );
}
