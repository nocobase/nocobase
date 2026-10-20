import { usePageBreadcrumb } from '@nocobase/app-client';
import { PageHeader } from '#components/page-header';
import type { ReactNode } from 'react';
import type { To } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';

export function WorkflowDetailPage({
  title,
  description,
  titleSuffix,
  listTitle,
  closeTo,
  children,
}: {
  title: string;
  description?: ReactNode;
  titleSuffix?: ReactNode;
  listTitle: string;
  closeTo: To;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  usePageBreadcrumb([
    { label: t('workflows.systemManagement') },
    { label: t('workflows.title'), to: '/workflows' },
    { label: listTitle, to: closeTo },
    { label: title },
  ]);
  return (
    <section className='flex flex-col gap-4'>
      <PageHeader
        title={
          titleSuffix ? (
            <span className='flex flex-wrap items-baseline gap-x-4 gap-y-2'>
              <span>{title}</span>
              {titleSuffix}
            </span>
          ) : (
            title
          )
        }
        description={description}
      />
      {children}
    </section>
  );
}
