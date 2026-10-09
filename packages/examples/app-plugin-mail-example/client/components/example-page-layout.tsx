import type { ReactElement, ReactNode } from 'react';

export function ExamplePageContainer({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  return <section className='w-full space-y-6 p-6 md:p-8'>{children}</section>;
}

export function ExamplePageHeader({
  actions,
  description,
  title,
}: {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
}): ReactElement {
  return (
    <header className='flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between'>
      <div className='min-w-0'>
        <h1 className='font-heading text-3xl font-semibold tracking-[-0.035em]'>
          {title}
        </h1>
        {description ? (
          <p className='mt-2 max-w-2xl text-sm leading-6 text-muted-foreground'>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className='flex flex-wrap items-center gap-2'>{actions}</div>
      ) : null}
    </header>
  );
}
