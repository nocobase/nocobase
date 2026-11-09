import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from '../../client/components/page-header.js';

// jsdom has no layout: these cases lock the classes that decide the phone layout. The geometry itself (no squeezed
// title, no sideways overflow at 375px, an unchanged desktop row) is checked in a browser, as mobile.md M1.1 asks.
const titles = [
  'Equipment maintenance work orders and spare parts procurement approvals',
  '设备维修工单与备件采购审批的统一管理工作台',
];

describe('PageHeader on a phone', () => {
  it.each(titles)(
    'keeps a long title readable beside several actions: %s',
    (title) => {
      render(
        <PageHeader
          title={title}
          description='Track every request from report to repair.'
          actions={
            <>
              <button type='button'>Preview</button>
              <button type='button'>New maintenance request</button>
            </>
          }
        />,
      );
      const heading = screen.getByRole('heading', { level: 1, name: title });
      // The whole title stays, wrapping between or inside long words rather than ending in an ellipsis.
      expect(heading).toHaveTextContent(title);
      expect(heading).toHaveClass('break-words');
      expect(heading).not.toHaveClass('truncate');
      // The title block keeps at least 12rem, so several actions wrap onto their own row instead of squeezing it.
      const titleBlock = heading.parentElement!;
      expect(titleBlock).toHaveClass('min-w-48', 'flex-1');
      const header = titleBlock.parentElement!;
      expect(header).toHaveClass('flex-wrap', 'sm:flex-nowrap');
      const actions = within(header).getByRole('button', {
        name: 'Preview',
      }).parentElement!;
      expect(actions).toHaveClass('max-w-full', 'flex-wrap');
      expect(
        within(actions)
          .getAllByRole('button')
          .map((b) => b.textContent),
      ).toEqual(['Preview', 'New maintenance request']);
    },
  );

  it('renders no action area without actions', () => {
    render(<PageHeader title='Orders' />);
    const header = screen.getByRole('banner');
    expect(header.children).toHaveLength(1);
  });
});

describe('PageHeader keeps the phone first screen short', () => {
  it('shows at most two lines of description on a phone and all of it from 640px up', () => {
    render(
      <PageHeader
        title='Repairs'
        description='Report broken equipment, follow each repair and confirm it is done. Drafts are kept on this device.'
      />,
    );
    const description = screen.getByText(/Report broken equipment/);
    expect(description).toHaveClass('line-clamp-2', 'sm:line-clamp-none');
  });

  it('shows an eyebrow above the title only from 640px up', () => {
    render(<PageHeader title='Repairs' eyebrow='Maintenance workspace' />);
    const eyebrow = screen.getByText('Maintenance workspace');
    expect(eyebrow).toHaveClass('hidden', 'sm:flex');
    expect(
      eyebrow.compareDocumentPosition(screen.getByRole('heading')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
