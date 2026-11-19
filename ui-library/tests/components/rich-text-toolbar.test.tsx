import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  RichTextEditor,
  type RichTextHandle,
} from '../../registry/components/rich-text-editor';

describe('rich text toolbar', () => {
  it('tracks formatting transactions and disables commands for a read-only editor', async () => {
    const ref = createRef<RichTextHandle>();
    render(<RichTextEditor ref={ref} value='' onChange={vi.fn()} />);
    const bold = await screen.findByRole('button', { name: 'Bold' });
    const editor = ref.current?.editor();
    if (!editor) throw new Error('The rich text editor did not initialize');

    act(() => {
      editor.commands.insertContent('Hello');
      editor.commands.selectAll();
    });
    fireEvent.click(bold);
    await waitFor(() => expect(bold).toHaveAttribute('aria-pressed', 'true'));
    expect(editor.getHTML()).toContain('<strong>Hello</strong>');

    act(() => {
      editor.commands.unsetBold();
    });
    await waitFor(() => expect(bold).toHaveAttribute('aria-pressed', 'false'));

    act(() => {
      editor.setEditable(false);
    });
    await waitFor(() => expect(bold).toBeDisabled());
  });
});
