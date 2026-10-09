import { PageHeader } from './page-header.js';
import type { ReactElement, ReactNode } from 'react';

export interface MailPageHeaderProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly actions?: ReactNode;
}

export function MailPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: MailPageHeaderProps): ReactElement {
  return (
    <div className='space-y-2'>
      <p className='text-xs text-muted-foreground'>{eyebrow}</p>
      <PageHeader title={title} description={description} actions={actions} />
    </div>
  );
}
