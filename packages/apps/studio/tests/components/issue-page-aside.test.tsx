/** The issue page's side column holds only the properties, the people and the dates. */
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../client/issues/detail/issue-aside.js', () => ({
  IssuePropertiesCard: () => <section>properties</section>,
  IssueFollowersCard: () => <section>followers</section>,
  IssueDatesCard: () => <section>dates</section>,
}));

const { IssuePageAside } =
  await import('../../client/pages/issues/detail/aside.js');

describe('IssuePageAside', () => {
  it('holds the properties, the people and the dates, and nothing else', () => {
    const { container } = render(
      <IssuePageAside
        detail={{} as never}
        update={{} as never}
        pageActions={{} as never}
      />,
    );
    expect(
      [...container.querySelectorAll('section')].map(
        (section) => section.textContent,
      ),
    ).toEqual(['properties', 'followers', 'dates']);
  });
});
