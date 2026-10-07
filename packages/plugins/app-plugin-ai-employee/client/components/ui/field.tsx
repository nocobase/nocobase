// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { cva } from 'class-variance-authority';
import {
  useMemo,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cn } from 'cn';
import { Label } from './label.js';
import { Separator } from './separator.js';

export function FieldSet({
  className,
  ...props
}: ComponentProps<'fieldset'>): ReactElement {
  return (
    <fieldset
      data-slot='field-set'
      className={cn(
        'flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3',
        className,
      )}
      {...props}
    />
  );
}

export type FieldLegendProps = ComponentProps<'legend'> & {
  readonly variant?: 'legend' | 'label';
};

export function FieldLegend({
  className,
  variant = 'legend',
  ...props
}: FieldLegendProps): ReactElement {
  return (
    <legend
      data-slot='field-legend'
      data-variant={variant}
      className={cn(
        'mb-1.5 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base',
        className,
      )}
      {...props}
    />
  );
}

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

const fieldVariants = cva(
  'group/field flex w-full gap-2 data-[invalid=true]:text-destructive',
  {
    variants: {
      orientation: {
        vertical: 'flex-col *:w-full [&>.sr-only]:w-auto',
        horizontal:
          'flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
        responsive:
          'flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
      },
    },
    defaultVariants: { orientation: 'vertical' },
  },
);

export type FieldProps = ComponentProps<'div'> & {
  readonly orientation?: 'vertical' | 'horizontal' | 'responsive';
};

export function Field({
  className,
  orientation = 'vertical',
  ...props
}: FieldProps): ReactElement {
  return (
    <div
      role='group'
      data-slot='field'
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

export function FieldContent({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='field-content'
      className={cn(
        'group/field-content flex flex-1 flex-col gap-0.5 leading-snug',
        className,
      )}
      {...props}
    />
  );
}

export function FieldLabel({
  className,
  ...props
}: ComponentProps<typeof Label>): ReactElement {
  return (
    <Label
      data-slot='field-label'
      className={cn(
        'group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 has-[>[data-slot=field]]:has-[:focus-visible]:border-ring has-[>[data-slot=field]]:has-[:focus-visible]:ring-3 has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/50 *:data-[slot=field]:p-2.5 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10',
        'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col',
        className,
      )}
      {...props}
    />
  );
}

export function FieldTitle({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='field-label'
      className={cn(
        'flex w-fit items-center gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50',
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

export type FieldSeparatorProps = ComponentProps<'div'> & {
  readonly children?: ReactNode;
};

export function FieldSeparator({
  children,
  className,
  ...props
}: FieldSeparatorProps): ReactElement {
  return (
    <div
      data-slot='field-separator'
      data-content={!!children}
      className={cn(
        'relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2',
        className,
      )}
      {...props}
    >
      <Separator className='absolute inset-0 top-1/2' />
      {children ? (
        <span
          className='relative mx-auto block w-fit bg-background px-2 text-muted-foreground'
          data-slot='field-separator-content'
        >
          {children}
        </span>
      ) : null}
    </div>
  );
}

export type FieldErrorProps = ComponentProps<'div'> & {
  readonly errors?: ReadonlyArray<{ message?: string } | undefined>;
};

export function FieldError({
  className,
  children,
  errors,
  ...props
}: FieldErrorProps): ReactElement | null {
  const content = useMemo(() => {
    if (children) return children;
    if (!errors?.length) return null;
    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ];
    if (uniqueErrors.length === 1) return uniqueErrors[0]?.message;
    return (
      <ul className='ml-4 flex list-disc flex-col gap-1'>
        {uniqueErrors.map((error) =>
          error?.message ? <li key={error.message}>{error.message}</li> : null,
        )}
      </ul>
    );
  }, [children, errors]);

  if (!content) return null;

  return (
    <div
      role='alert'
      data-slot='field-error'
      className={cn('text-sm font-normal text-destructive', className)}
      {...props}
    >
      {content}
    </div>
  );
}
