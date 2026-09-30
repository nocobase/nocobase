// shadcn base-nova source adapted for declaration-emitting ESM builds.
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva } from 'class-variance-authority';
import type { ComponentProps, ReactElement } from 'react';

import { cn } from '../../lib/utils.js';
import { Separator } from './separator.js';

export function ItemGroup({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      role='list'
      data-slot='item-group'
      className={cn(
        'group/item-group flex w-full flex-col gap-4 has-data-[size=sm]:gap-2.5 has-data-[size=xs]:gap-2',
        className,
      )}
      {...props}
    />
  );
}

export function ItemSeparator({
  className,
  ...props
}: ComponentProps<typeof Separator>): ReactElement {
  return (
    <Separator
      data-slot='item-separator'
      orientation='horizontal'
      className={cn('my-2', className)}
      {...props}
    />
  );
}

const itemVariants = cva(
  'group/item flex w-full flex-wrap items-center rounded-lg border text-sm transition-colors duration-100 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [a]:transition-colors [a]:hover:bg-muted',
  {
    variants: {
      variant: {
        default: 'border-transparent',
        outline: 'border-border',
        muted: 'border-transparent bg-muted/50',
      },
      size: {
        default: 'gap-2.5 px-3 py-2.5',
        sm: 'gap-2.5 px-3 py-2.5',
        xs: 'gap-2 px-2.5 py-2 in-data-[slot=dropdown-menu-content]:p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export type ItemProps = useRender.ComponentProps<'div'> & {
  readonly variant?: 'default' | 'outline' | 'muted';
  readonly size?: 'default' | 'sm' | 'xs';
};

export function Item({
  className,
  variant = 'default',
  size = 'default',
  render,
  ...props
}: ItemProps): ReactElement {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      { className: cn(itemVariants({ variant, size, className })) },
      props,
    ),
    render,
    state: { slot: 'item', variant, size },
  });
}

const itemMediaVariants = cva(
  'flex shrink-0 items-center justify-center gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start [&_svg]:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "[&_svg:not([class*='size-'])]:size-4",
        image:
          'size-10 overflow-hidden rounded-sm group-data-[size=sm]/item:size-8 group-data-[size=xs]/item:size-6 [&_img]:size-full [&_img]:object-cover',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export type ItemMediaProps = ComponentProps<'div'> & {
  readonly variant?: 'default' | 'icon' | 'image';
};

export function ItemMedia({
  className,
  variant = 'default',
  ...props
}: ItemMediaProps): ReactElement {
  return (
    <div
      data-slot='item-media'
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

export function ItemContent({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='item-content'
      className={cn(
        'flex flex-1 flex-col gap-1 group-data-[size=xs]/item:gap-0 [&+[data-slot=item-content]]:flex-none',
        className,
      )}
      {...props}
    />
  );
}

export function ItemTitle({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='item-title'
      className={cn(
        'line-clamp-1 flex w-fit items-center gap-2 text-sm leading-snug font-medium underline-offset-4',
        className,
      )}
      {...props}
    />
  );
}

export function ItemDescription({
  className,
  ...props
}: ComponentProps<'p'>): ReactElement {
  return (
    <p
      data-slot='item-description'
      className={cn(
        'line-clamp-2 text-left text-sm leading-normal font-normal text-muted-foreground group-data-[size=xs]/item:text-xs [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary',
        className,
      )}
      {...props}
    />
  );
}

export function ItemActions({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='item-actions'
      className={cn('flex items-center gap-2', className)}
      {...props}
    />
  );
}

export function ItemHeader({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='item-header'
      className={cn(
        'flex basis-full items-center justify-between gap-2',
        className,
      )}
      {...props}
    />
  );
}

export function ItemFooter({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='item-footer'
      className={cn(
        'flex basis-full items-center justify-between gap-2',
        className,
      )}
      {...props}
    />
  );
}
