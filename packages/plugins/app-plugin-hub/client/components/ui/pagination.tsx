import { useTranslation } from '@nocobase/i18n/client';
import * as React from 'react';
import { cn } from 'cn';

import { Button } from './button.js';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from 'lucide-react';

function Pagination(
  inputProps: React.ComponentProps<'nav'>,
): React.ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const { className, ...props } = inputProps;

  return (
    <nav
      role='navigation'
      aria-label={t('common.pagination', { defaultValue: 'pagination' })}
      data-slot='pagination'
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<'ul'>): React.ReactElement {
  return (
    <ul
      data-slot='pagination-content'
      className={cn('flex items-center gap-0.5', className)}
      {...props}
    />
  );
}

function PaginationItem({
  ...props
}: React.ComponentProps<'li'>): React.ReactElement {
  return <li data-slot='pagination-item' {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'a'>;

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps): React.ReactElement {
  return (
    <Button
      variant={isActive ? 'outline' : 'ghost'}
      size={size}
      className={cn(className)}
      nativeButton={false}
      render={
        <a
          aria-current={isActive ? 'page' : undefined}
          data-slot='pagination-link'
          data-active={isActive}
          {...props}
        />
      }
    />
  );
}

function PaginationPrevious(
  inputProps: React.ComponentProps<typeof PaginationLink> & {
    text?: string;
  },
): React.ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const {
    className,
    text = t('common.previous', { defaultValue: 'Previous' }),
    ...props
  } = inputProps;

  return (
    <PaginationLink
      aria-label={t('common.previousPage', {
        defaultValue: 'Go to previous page',
      })}
      size='default'
      className={cn('pl-1.5!', className)}
      {...props}
    >
      <ChevronLeftIcon data-icon='inline-start' />
      <span className='hidden sm:block'>{text}</span>
    </PaginationLink>
  );
}

function PaginationNext(
  inputProps: React.ComponentProps<typeof PaginationLink> & {
    text?: string;
  },
): React.ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const {
    className,
    text = t('common.next', { defaultValue: 'Next' }),
    ...props
  } = inputProps;

  return (
    <PaginationLink
      aria-label={t('common.nextPage', { defaultValue: 'Go to next page' })}
      size='default'
      className={cn('pr-1.5!', className)}
      {...props}
    >
      <span className='hidden sm:block'>{text}</span>
      <ChevronRightIcon data-icon='inline-end' />
    </PaginationLink>
  );
}

function PaginationEllipsis(
  inputProps: React.ComponentProps<'span'>,
): React.ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const { className, ...props } = inputProps;

  return (
    <span
      aria-hidden
      data-slot='pagination-ellipsis'
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className='sr-only'>
        {t('common.morePages', { defaultValue: 'More pages' })}
      </span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
