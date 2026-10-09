import type { ReactElement, ReactNode } from 'react';

import { Button } from '#components/ui/button';

export interface EditablePanelProps {
  readonly children?: ReactNode;
  readonly description?: string;
  readonly onAction?: () => void;
  readonly title?: string;
}

export function EditablePanel({
  children,
  description = 'Edit this component after installing it in your application.',
  onAction,
  title = 'Application-owned component',
}: EditablePanelProps): ReactElement {
  return (
    <section className='space-y-4 rounded-xl border p-6'>
      <div className='space-y-1'>
        <h2 className='font-semibold'>{title}</h2>
        <p className='text-sm text-muted-foreground'>{description}</p>
      </div>
      {children}
      {onAction ? <Button onClick={onAction}>Run action</Button> : null}
    </section>
  );
}
