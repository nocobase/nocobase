import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { IssuePerson } from '../../client/components/issue-table';
import { PersonValue } from '../../client/components/property-fields';

function avatarOf(container: HTMLElement): Element | null {
  return container.querySelector('[data-slot="agent-avatar"]');
}

describe('agent avatars', () => {
  it('draws an agent as its initial on a tint picked from its name', () => {
    const first = render(
      <IssuePerson person={{ name: 'Reviewer', kind: 'agent' }} fallback='-' />,
    );
    const second = render(<PersonValue name='Reviewer' agent />);
    const a = avatarOf(first.container);
    const b = avatarOf(second.container);
    expect(a?.textContent).toBe('R');
    expect(a?.getAttribute('data-tint')).toBe(b?.getAttribute('data-tint'));
  });

  it('leaves a person without a picture as the name alone', () => {
    const { container } = render(<PersonValue name='Ada' />);
    expect(avatarOf(container)).toBeNull();
    expect(container.textContent).toBe('Ada');
  });
});
