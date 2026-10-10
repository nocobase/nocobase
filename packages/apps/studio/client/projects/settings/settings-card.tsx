/**
 * One card of a project's Settings tab (`page.tsx`): its title and one-sentence description, with what belongs beside
 * the title (a status, a menu), its fields, and a footer holding the card's own Save at the bottom right (T4.2), with an
 * optional note on the left (such as "saved as you change them" for a card that saves inline).
 */
import type { ReactElement, ReactNode } from 'react';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { sectionAnchor } from './model.js';

export interface SettingsCardProps {
  /** The card's key; `project-settings-<id>` is its anchor. */
  readonly id: string;
  /** Left out when what the card holds draws its own heading (the agents plugin's variables and skills). */
  readonly title?: ReactNode;
  /** The card's accessible name when it has no `title`. */
  readonly label?: string;
  readonly description?: ReactNode;
  /** Beside the title, at the header's end. */
  readonly headerAction?: ReactNode;
  readonly children?: ReactNode;
  /** A muted line at the footer's start. */
  readonly note?: ReactNode;
  /** The card's own actions, its Save, at the footer's end. */
  readonly actions?: ReactNode;
}

export function SettingsCard({
  id,
  title,
  label,
  description,
  headerAction,
  children,
  note,
  actions,
}: SettingsCardProps): ReactElement {
  const anchor = sectionAnchor(id);
  return (
    <Card
      id={anchor}
      role='region'
      aria-labelledby={title ? `${anchor}-title` : undefined}
      aria-label={title ? undefined : label}
      data-settings-section={id}
      className='scroll-mt-4'
    >
      {title ? (
        <CardHeader>
          <CardTitle id={`${anchor}-title`}>{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
          {headerAction ? <CardAction>{headerAction}</CardAction> : null}
        </CardHeader>
      ) : null}
      {children ? (
        <CardContent className='flex flex-col gap-6'>{children}</CardContent>
      ) : null}
      {note || actions ? (
        <CardFooter className='flex-wrap justify-end gap-2'>
          {note ? (
            <p className='mr-auto text-sm text-muted-foreground'>{note}</p>
          ) : null}
          {actions}
        </CardFooter>
      ) : null}
    </Card>
  );
}
