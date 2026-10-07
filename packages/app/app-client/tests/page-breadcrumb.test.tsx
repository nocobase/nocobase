import { fireEvent, render, screen } from '@testing-library/react';
import { useState, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  PageBreadcrumbProvider,
  usePageBreadcrumb,
  usePageBreadcrumbLevels,
  type PageBreadcrumbLevel,
} from '../src/index.js';

function Header(): ReactElement {
  const levels = usePageBreadcrumbLevels();
  return (
    <output data-testid='trail'>
      {levels ? levels.map((level) => level.label).join(' > ') : 'routes'}
    </output>
  );
}

function Page({
  levels,
  children,
}: {
  readonly levels: readonly PageBreadcrumbLevel[] | null;
  readonly children?: ReactNode;
}): ReactElement {
  usePageBreadcrumb(levels);
  return <>{children}</>;
}

const trail = (): string | null => screen.getByTestId('trail').textContent;

describe('usePageBreadcrumb', () => {
  it('leaves the trail to the routes until a page declares one', () => {
    function Loading(): ReactElement {
      const [loaded, setLoaded] = useState(false);
      return (
        <Page
          levels={
            loaded
              ? [{ label: 'Projects', to: '/projects' }, { label: 'CRM' }]
              : null
          }
        >
          <button type='button' onClick={() => setLoaded(true)}>
            load
          </button>
        </Page>
      );
    }
    render(
      <PageBreadcrumbProvider>
        <Header />
        <Loading />
      </PageBreadcrumbProvider>,
    );
    expect(trail()).toBe('routes');
    fireEvent.click(screen.getByRole('button', { name: 'load' }));
    expect(trail()).toBe('Projects > CRM');
  });

  it('shows the innermost page and returns to the outer one when it closes', () => {
    function Issue(): ReactElement {
      const [open, setOpen] = useState(true);
      return (
        <Page levels={[{ label: 'Issues', to: '/issues' }, { label: 'PM-1' }]}>
          {open ? (
            <Page
              levels={[
                { label: 'Issues', to: '/issues' },
                { label: 'PM-1', to: '/issues/PM-1' },
                { label: 'Plan' },
              ]}
            />
          ) : null}
          <button type='button' onClick={() => setOpen(false)}>
            close
          </button>
        </Page>
      );
    }
    render(
      <PageBreadcrumbProvider>
        <Header />
        <Issue />
      </PageBreadcrumbProvider>,
    );
    expect(trail()).toBe('Issues > PM-1 > Plan');
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(trail()).toBe('Issues > PM-1');
  });

  it('does nothing without a provider', () => {
    render(<Page levels={[{ label: 'Alone' }]} />);
    expect(document.body.textContent).toBe('');
  });
});
