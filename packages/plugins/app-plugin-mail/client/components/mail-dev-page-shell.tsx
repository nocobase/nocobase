import { PageContainer } from './page-container.js';
import { PageHeader } from './page-header.js';
import type { ReactElement, ReactNode } from 'react';

export interface MailDevPageShellProps {
  readonly navigation?: ReactNode;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly description: string;
  readonly title: string;
}

export function MailDevPageShell({
  actions,
  navigation,
  children,
  description,
  title,
}: MailDevPageShellProps): ReactElement {
  return (
    <PageContainer className='@container/main'>
      <PageHeader title={title} description={description} actions={actions} />
      {navigation}
      {children}
    </PageContainer>
  );
}
