import { usePageBreadcrumbLevels } from '@nocobase/app-client';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

/** What the application's header does with the trail a page declares: its earlier levels link back. */
export function HeaderTrail(): ReactElement {
  const levels = usePageBreadcrumbLevels() ?? [];
  return (
    <header>
      {levels.map((level) =>
        level.to ? (
          <Link key={level.label} to={level.to}>
            {level.label}
          </Link>
        ) : (
          <span key={level.label}>{level.label}</span>
        ),
      )}
    </header>
  );
}
