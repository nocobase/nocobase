import type { ComponentPropsWithoutRef, ReactElement } from 'react';

import { cn } from 'cn';

/**
 * Prose primitives carrying the utility classes from the shadcn Typography
 * guide. shadcn ships no typography styles, so these keep long-form text
 * consistent without repeating the class strings on every page. Headings use
 * the application's `font-heading` token like `PageHeader` does.
 */

export function TypographyH1({
  className,
  ...props
}: ComponentPropsWithoutRef<'h1'>): ReactElement {
  return (
    <h1
      className={cn(
        'scroll-m-20 font-heading text-4xl font-extrabold tracking-tight text-balance',
        className,
      )}
      {...props}
    />
  );
}

export function TypographyH2({
  className,
  ...props
}: ComponentPropsWithoutRef<'h2'>): ReactElement {
  return (
    <h2
      className={cn(
        'scroll-m-20 border-b pb-2 font-heading text-3xl font-semibold tracking-tight first:mt-0',
        className,
      )}
      {...props}
    />
  );
}

export function TypographyH3({
  className,
  ...props
}: ComponentPropsWithoutRef<'h3'>): ReactElement {
  return (
    <h3
      className={cn(
        'scroll-m-20 font-heading text-2xl font-semibold tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

export function TypographyH4({
  className,
  ...props
}: ComponentPropsWithoutRef<'h4'>): ReactElement {
  return (
    <h4
      className={cn(
        'scroll-m-20 font-heading text-xl font-semibold tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

export function TypographyP({
  className,
  ...props
}: ComponentPropsWithoutRef<'p'>): ReactElement {
  return (
    <p
      className={cn('leading-7 [&:not(:first-child)]:mt-6', className)}
      {...props}
    />
  );
}

export function TypographyBlockquote({
  className,
  ...props
}: ComponentPropsWithoutRef<'blockquote'>): ReactElement {
  return (
    <blockquote
      className={cn('mt-6 border-l-2 pl-6 italic', className)}
      {...props}
    />
  );
}

export interface TypographyListProps extends ComponentPropsWithoutRef<'ul'> {
  /** Render an ordered list instead of bullets. */
  readonly ordered?: boolean;
}

export function TypographyList({
  className,
  ordered = false,
  ...props
}: TypographyListProps): ReactElement {
  const classes = cn(
    'my-6 ml-6 [&>li]:mt-2',
    ordered ? 'list-decimal' : 'list-disc',
    className,
  );
  return ordered ? (
    <ol className={classes} {...props} />
  ) : (
    <ul className={classes} {...props} />
  );
}

export function TypographyTable({
  className,
  ...props
}: ComponentPropsWithoutRef<'table'>): ReactElement {
  return (
    <div className='my-6 w-full overflow-y-auto'>
      <table
        className={cn(
          'w-full [&_tr]:m-0 [&_tr]:border-t [&_tr]:p-0 [&_tr:nth-child(even)]:bg-muted',
          '[&_th]:border [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-bold [&_th[align=center]]:text-center [&_th[align=right]]:text-right',
          '[&_td]:border [&_td]:px-4 [&_td]:py-2 [&_td]:text-left [&_td[align=center]]:text-center [&_td[align=right]]:text-right',
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function TypographyInlineCode({
  className,
  ...props
}: ComponentPropsWithoutRef<'code'>): ReactElement {
  return (
    <code
      className={cn(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
        className,
      )}
      {...props}
    />
  );
}

export function TypographyLead({
  className,
  ...props
}: ComponentPropsWithoutRef<'p'>): ReactElement {
  return (
    <p className={cn('text-xl text-muted-foreground', className)} {...props} />
  );
}

export function TypographyLarge({
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>): ReactElement {
  return <div className={cn('text-lg font-semibold', className)} {...props} />;
}

export function TypographySmall({
  className,
  ...props
}: ComponentPropsWithoutRef<'small'>): ReactElement {
  return (
    <small
      className={cn('text-sm leading-none font-medium', className)}
      {...props}
    />
  );
}

export function TypographyMuted({
  className,
  ...props
}: ComponentPropsWithoutRef<'p'>): ReactElement {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  );
}
