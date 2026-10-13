// Adapted from shadcn base-nova: retain the field primitives used by Mail filters.
import type { ComponentProps, ReactElement } from 'react';
import { cn } from 'cn';

export function FieldGroup({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='field-group'
      className={cn(
        'group/field-group @container/field-group flex w-full flex-col gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4',
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      role='group'
      data-slot='field'
      data-orientation='vertical'
      className={cn(
        'group/field flex w-full flex-col gap-2 data-[invalid=true]:text-destructive *:w-full [&>.sr-only]:w-auto',
        className,
      )}
      {...props}
    />
  );
}

export function FieldLabel({
  className,
  ...props
}: ComponentProps<'label'>): ReactElement {
  return (
    <label
      data-slot='field-label'
      className={cn(
        'group/field-label peer/field-label flex w-fit items-center gap-2 text-sm font-medium leading-snug select-none group-data-[disabled=true]/field:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function FieldDescription({
  className,
  ...props
}: ComponentProps<'p'>): ReactElement {
  return (
    <p
      data-slot='field-description'
      className={cn(
        'text-left text-sm leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5',
        'last:mt-0 nth-last-2:-mt-1',
        '[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary',
        className,
      )}
      {...props}
    />
  );
}

export function FieldError({
  className,
  children,
  ...props
}: ComponentProps<'div'>): ReactElement | null {
  if (!children) return null;
  return (
    <div
      role='alert'
      data-slot='field-error'
      className={cn('text-sm font-normal text-destructive', className)}
      {...props}
    >
      {children}
    </div>
  );
}
