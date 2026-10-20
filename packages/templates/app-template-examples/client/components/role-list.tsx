import type { ReactElement } from 'react';
import { Link, type To } from 'react-router';
import { Badge } from '#components/ui/badge';

export interface RoleListRole {
  readonly key: string;
  readonly title: string;
  readonly to: To;
  readonly protected: boolean;
}

export interface RoleListProps {
  readonly roles: readonly RoleListRole[];
  readonly labels: {
    readonly protected: string;
    readonly custom: string;
  };
  readonly ariaLabel?: string;
}

/** A compact content list; the host owns authorization, loading and filtering. */
export function RoleList({
  roles,
  labels,
  ariaLabel,
}: RoleListProps): ReactElement {
  return (
    <ul
      aria-label={ariaLabel}
      className='@container divide-y rounded-lg border bg-card [&>li:first-child]:rounded-t-lg [&>li:last-child]:rounded-b-lg'
    >
      {roles.map((role) => (
        <li
          key={role.key}
          className='group/role grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 px-3 py-2 transition-colors hover:bg-muted/50 @xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_6rem]'
        >
          <Link
            to={role.to}
            className='-my-1 w-fit max-w-full min-w-0 truncate py-1 text-sm leading-5 font-medium text-foreground underline-offset-4 group-hover/role:underline'
            title={role.title}
          >
            {role.title}
          </Link>
          <span
            className='col-start-1 row-start-2 min-w-0 truncate text-xs leading-4 text-muted-foreground @xl:col-start-2 @xl:row-start-1'
            title={role.key}
          >
            {role.key}
          </span>
          <Badge
            variant='secondary'
            data-size='sm'
            className='col-start-2 row-span-2 row-start-1 shrink-0 justify-self-end @xl:col-start-3 @xl:row-span-1'
          >
            {role.protected ? labels.protected : labels.custom}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
