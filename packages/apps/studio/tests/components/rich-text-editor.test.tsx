import { Extension } from '@tiptap/core';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { HeadingIcon } from 'lucide-react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  RichTextEditor,
  type RichTextHandle,
  type RichTextMention,
  RichTextToolbar,
  RichTextToolbarButton,
} from '../../client/components/rich-text-editor';
import {
  findMentionQuery,
  roundTripMarkdown,
} from '../../client/components/rich-text-markdown';

describe('rich text Markdown', () => {
  it('keeps mention links, task lists, tables and readable escapes through a round trip', () => {
    const source = [
      'Ask [@Ada Lovelace](mention://user/u1) and [@Code Agent](mention://agent/a%2F1) about A & B, x > 1',
      '',
      '- [ ] write tests',
      '- [x] ship',
      '',
      '| a | b |',
      '| --- | --- |',
      '| 1 | 2 |',
      '',
      'See https://example.com',
    ].join('\n');
    const once = roundTripMarkdown(source);
    expect(once).toContain('[@Ada Lovelace](mention://user/u1)');
    expect(once).toContain('[@Code Agent](mention://agent/a%2F1)');
    expect(once).toContain('A & B, x > 1');
    expect(once).toContain('- [ ] write tests');
    expect(once).toMatch(/\| a +\| b +\|/u);
    expect(once).toContain('See https://example.com');
    expect(roundTripMarkdown(once)).toBe(once);
  });

  it('opens a mention query after CJK text and for the full-width ＠, but not inside an email address', () => {
    expect(findMentionQuery('你好@张', 4)).toEqual({ start: 2, query: '张' });
    expect(findMentionQuery('请＠张伟', 4)).toEqual({
      start: 1,
      query: '张伟',
    });
    expect(findMentionQuery('mail ada@example', 16)).toBeNull();
    expect(findMentionQuery('@ada lovelace', 13)).toBeNull();
  });
});

const PEOPLE: readonly RichTextMention[] = [
  { kind: 'user', id: 'u1', name: 'Ada Lovelace' },
  { kind: 'user', id: 'u2', name: '张伟' },
];

const search = (query: string): Promise<readonly RichTextMention[]> =>
  Promise.resolve(PEOPLE.filter((person) => person.name.includes(query)));

function renderEditor(
  props: Partial<Parameters<typeof RichTextEditor>[0]> = {},
) {
  const ref = createRef<RichTextHandle>();
  const onChange = vi.fn();
  render(
    <RichTextEditor
      ref={ref}
      value=''
      onChange={onChange}
      aria-label='Comment'
      onMentionSearch={search}
      {...props}
    />,
  );
  const editor = ref.current?.editor();
  if (!editor) throw new Error('no editor');
  const textbox = screen.getByRole('textbox', { name: 'Comment' });
  // jsdom cannot measure a selection; scrolling belongs to the browser tests.
  editor.setOptions({
    editorProps: {
      ...editor.options.editorProps,
      handleScrollToSelection: () => true,
    },
  });
  // Establish DOM focus before editing, without commands.focus()'s delayed animation frame.
  act(() => editor.view.focus());
  return { editor, textbox, onChange, ref };
}

describe('RichTextEditor', () => {
  it.each([
    {
      kind: 'agent',
      id: 'long-description',
      name: '代码助手',
      hint: '负责代码审查、测试与发布（包含中文、English，以及全角标点！）'.repeat(
        6,
      ),
    },
    {
      kind: 'agent',
      id: 'long-name',
      name: 'CodeReviewAssistantWithoutSpaces'.repeat(8),
      hint: 'Reviews code',
    },
  ])(
    'shows full mention text on hover and selects it by mouse: $id',
    async (candidate) => {
      const user = userEvent.setup();
      const { editor, textbox, onChange } = renderEditor({
        onMentionSearch: () => Promise.resolve([candidate]),
      });
      act(() => {
        editor.commands.focus();
        editor.commands.insertContent('@');
      });
      const option = await screen.findByRole('option');
      for (const text of [candidate.name, candidate.hint]) {
        await user.hover(screen.getByText(text));
        expect((await screen.findByRole('tooltip')).textContent).toBe(text);
        expect(document.activeElement).toBe(textbox);
        await user.unhover(screen.getByText(text, { selector: 'span' }));
        await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
      }
      fireEvent.mouseDown(option);
      await waitFor(() =>
        expect(onChange).toHaveBeenLastCalledWith(
          `[@${candidate.name}](mention://${candidate.kind}/${candidate.id}) `,
        ),
      );
      expect(screen.queryByRole('listbox')).toBeNull();
    },
  );

  it('inserts a mention chosen from the suggestion list, stored as a mention link', async () => {
    const { editor, textbox, onChange } = renderEditor();
    act(() => {
      editor.commands.insertContent('Ask @Ad');
    });
    await screen.findByRole('option', { name: 'Ada Lovelace' });
    expect(textbox.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(textbox, { key: 'Enter' });
    // Also verify the stored Markdown after any deferred focus or DOM observation has settled.
    await act(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    });
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        'Ask [@Ada Lovelace](mention://user/u1) ',
      ),
    );
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('refreshes an open mention query after a retry without changing the draft', async () => {
    const agent: RichTextMention = {
      kind: 'agent',
      id: 'a1',
      name: 'Review Agent',
    };
    const member: RichTextMention = {
      kind: 'user',
      id: 'u1',
      name: 'Ada Lovelace',
    };
    let refreshed = false;
    const onMentionSearch = vi.fn(() =>
      Promise.resolve(refreshed ? [agent, member] : [agent]),
    );
    const onChange = vi.fn();
    const ref = createRef<RichTextHandle>();
    const { rerender } = render(
      <RichTextEditor
        ref={ref}
        value=''
        onChange={onChange}
        onMentionSearch={onMentionSearch}
        aria-label='Comment'
        mentionSearchRevision={0}
      />,
    );
    const textbox = screen.getByRole('textbox', { name: 'Comment' });
    act(() => {
      ref.current?.editor()?.commands.focus();
      ref.current?.editor()?.commands.insertContent('@');
    });
    await screen.findByRole('option', { name: 'Review Agent' });
    expect(screen.queryByRole('option', { name: 'Ada Lovelace' })).toBeNull();

    refreshed = true;
    rerender(
      <RichTextEditor
        ref={ref}
        value=''
        onChange={onChange}
        onMentionSearch={onMentionSearch}
        aria-label='Comment'
        mentionSearchRevision={1}
      />,
    );
    await screen.findByRole('option', {
      name: 'Ada Lovelace',
    });
    expect(textbox.textContent).toBe('@');
    expect(document.activeElement).toBe(textbox);
    fireEvent.keyDown(textbox, { key: 'ArrowDown' });
    fireEvent.keyDown(textbox, { key: 'Enter' });
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        '[@Ada Lovelace](mention://user/u1) ',
      ),
    );
  });

  it('keeps candidates beyond eight reachable by keyboard and in a scrollable list', async () => {
    const agents = Array.from({ length: 10 }, (_, index) => ({
      kind: 'agent',
      id: `a${index}`,
      name: `Agent ${index}`,
      kindLabel: 'Agent',
    }));
    const members: RichTextMention[] = [
      { kind: 'user', id: 'u1', name: 'Ada Lovelace', kindLabel: 'Person' },
      { kind: 'user', id: 'u2', name: '张伟', kindLabel: 'Person' },
    ];
    const { editor, textbox, onChange } = renderEditor({
      onMentionSearch: () => Promise.resolve([...agents, ...members]),
    });
    act(() => {
      editor.commands.focus();
      editor.commands.insertContent('@');
    });

    const list = await screen.findByRole('listbox');
    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(12);
    expect(list.className).toContain('overflow-y-auto');
    expect(screen.getAllByText('Person')).toHaveLength(2);

    for (let index = 0; index < 10; index += 1) {
      fireEvent.keyDown(textbox, { key: 'ArrowDown' });
    }
    expect(options[10]?.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(textbox, { key: 'Enter' });
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        '[@Ada Lovelace](mention://user/u1) ',
      ),
    );
  });

  it('allows mouse selection of an Agent after the former suggestion limit', async () => {
    const agents = Array.from({ length: 10 }, (_, index) => ({
      kind: 'agent',
      id: `a${index}`,
      name: `Agent ${index}`,
      kindLabel: 'Agent',
    }));
    const { editor, onChange } = renderEditor({
      onMentionSearch: () => Promise.resolve(agents),
    });
    act(() => {
      editor.commands.focus();
      editor.commands.insertContent('@');
    });

    const option = (await screen.findAllByRole('option'))[9];
    expect(option).toBeTruthy();
    fireEvent.mouseDown(option!);
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        '[@Agent 9](mention://agent/a9) ',
      ),
    );
  });

  it('opens the list for a full-width ＠ typed right after CJK text', async () => {
    const { editor } = renderEditor();
    act(() => {
      editor.commands.insertContent('请＠张');
    });
    expect(await screen.findByRole('option', { name: '张伟' })).toBeTruthy();
  });

  it('submits on Enter and splits on Shift + Enter in a message box, while the list is closed', () => {
    const onSubmit = vi.fn();
    const { editor, textbox } = renderEditor({ submitOnEnter: true, onSubmit });
    act(() => {
      editor.commands.insertContent('hello');
    });
    fireEvent.keyDown(textbox, { key: 'Enter', shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(editor.state.doc.childCount).toBe(2);
    fireEvent.keyDown(textbox, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('takes extra extensions and a custom toolbar built from the exported parts', () => {
    const onShortcut = vi.fn(() => true);
    const Shortcut = Extension.create({
      name: 'testShortcut',
      addKeyboardShortcuts: () => ({ 'Mod-k': onShortcut }),
    });
    const { editor, textbox } = renderEditor({
      extensions: [Shortcut],
      toolbar: () => (
        <RichTextToolbar label='Custom'>
          <RichTextToolbarButton
            label='Heading'
            icon={HeadingIcon}
            run={(current) =>
              current.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={(current) => current.isActive('heading', { level: 2 })}
          />
        </RichTextToolbar>
      ),
    });
    expect(screen.getByRole('toolbar', { name: 'Custom' })).toBeTruthy();
    act(() => {
      editor.commands.insertContent('Title');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Heading' }));
    expect(editor.isActive('heading', { level: 2 })).toBe(true);
    expect(
      screen
        .getByRole('button', { name: 'Heading' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    fireEvent.keyDown(textbox, { key: 'k', ctrlKey: true });
    expect(onShortcut).toHaveBeenCalled();
  });
});
