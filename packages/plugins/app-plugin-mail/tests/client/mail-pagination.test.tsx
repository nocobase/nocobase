import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MailPagination } from '../../client/components/mail-pagination.js';

const defaults = {
  page: 1,
  pageSize: 20,
  hasNext: true,
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
};

describe('shared mail pagination', () => {
  it('disables every control during loading and does not reload the active page', () => {
    const onPageChange = vi.fn();
    const view = render(
      <MailPagination {...defaults} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Page 1' }));
    expect(onPageChange).not.toHaveBeenCalled();
    view.rerender(<MailPagination {...defaults} disabled />);
    for (const button of screen.getAllByRole('button'))
      expect(button).toBeDisabled();
    expect(screen.getByRole('spinbutton')).toBeDisabled();
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('validates page entry, submits with Enter, and syncs the input after navigation', () => {
    const onPageChange = vi.fn();
    const view = render(
      <MailPagination {...defaults} total={200} onPageChange={onPageChange} />,
    );
    const input = screen.getByRole('spinbutton');
    for (const value of ['', '0', '-1', '1.5', '11', '9007199254740992']) {
      fireEvent.change(input, { target: { value } });
      expect(
        screen.getByRole('button', { name: 'Go', exact: true }),
      ).toBeDisabled();
    }
    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.submit(input.closest('form')!);
    expect(onPageChange).toHaveBeenCalledWith(8);
    view.rerender(
      <MailPagination
        {...defaults}
        page={8}
        total={200}
        onPageChange={onPageChange}
      />,
    );
    expect(input).toHaveValue(8);
    expect(screen.getByRole('button', { name: 'Page 8' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Page 10' }));
    expect(onPageChange).toHaveBeenLastCalledWith(10);
  });
});
