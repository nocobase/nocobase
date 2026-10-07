import { Extension } from '@tiptap/core';
import { CalendarClockIcon, HeadingIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { MarkdownView } from '@/components/markdown-view';
import {
  RichTextBlockTools,
  RichTextEditor,
  RichTextInlineTools,
  type RichTextMention,
  RichTextToolbar,
  RichTextToolbarButton,
  RichTextToolbarSeparator,
} from '@/components/rich-text-editor';

const PEOPLE: readonly RichTextMention[] = [
  { kind: 'user', id: 'u1', name: 'Ada Lovelace' },
  { kind: 'user', id: 'u2', name: 'Grace Hopper' },
  { kind: 'user', id: 'u3', name: '张伟' },
  { kind: 'agent', id: 'a1', name: 'Code Agent', hint: 'agent' },
];

const searchPeople = (query: string): Promise<readonly RichTextMention[]> =>
  Promise.resolve(
    PEOPLE.filter((person) =>
      person.name.toLowerCase().includes(query.toLowerCase()),
    ),
  );

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    timestamp: {
      /** Inserts today's date at the caret. */
      insertTimestamp: () => ReturnType;
    };
  }
}

/** An extension of our own: a command and its shortcut (⌘/Ctrl + Shift + D). */
const Timestamp = Extension.create({
  name: 'timestamp',
  addCommands() {
    return {
      insertTimestamp:
        () =>
        ({ commands }) =>
          commands.insertContent(new Date().toISOString().slice(0, 10)),
    };
  },
  addKeyboardShortcuts() {
    return { 'Mod-Shift-d': () => this.editor.commands.insertTimestamp() };
  },
});

// Stable: the editor reads its extensions once.
const EXTRA_EXTENSIONS = [Timestamp];

export function RichTextEditorDemo(): ReactElement {
  const [value, setValue] = useState(
    '## Sign-in\n\n- Validate the **email**\n- Ask [@Ada Lovelace](mention://user/u1)',
  );
  const [notes, setNotes] = useState('');
  return (
    <div className='grid gap-8 p-6'>
      <section className='grid gap-3'>
        <h2 className='text-sm font-medium'>Default</h2>
        <div className='grid gap-6 lg:grid-cols-2'>
          <RichTextEditor
            value={value}
            onChange={setValue}
            aria-label='Description'
            placeholder='Type @ (or ＠) to mention someone'
            mentionPlacement='below'
            onMentionSearch={searchPeople}
            onUpload={(file) =>
              Promise.resolve({
                url: `https://example.com/${file.name}`,
                name: file.name,
              })
            }
            contentClassName='min-h-40'
          />
          <MarkdownView content={value} className='rounded-lg border p-4' />
        </div>
      </section>
      <section className='grid gap-3'>
        <h2 className='text-sm font-medium'>
          Extended: an extra extension and a custom toolbar
        </h2>
        <div className='grid gap-6 lg:grid-cols-2'>
          <RichTextEditor
            value={notes}
            onChange={setNotes}
            aria-label='Meeting notes'
            placeholder='Notes… ⌘/Ctrl + Shift + D inserts the date'
            mentionPlacement='below'
            onMentionSearch={searchPeople}
            extensions={EXTRA_EXTENSIONS}
            toolbar={() => (
              <RichTextToolbar label='Formatting'>
                <RichTextToolbarButton
                  label='Heading'
                  icon={HeadingIcon}
                  run={(editor) =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  isActive={(editor) =>
                    editor.isActive('heading', { level: 2 })
                  }
                />
                <RichTextInlineTools />
                <RichTextToolbarSeparator />
                <RichTextBlockTools />
                <RichTextToolbarSeparator />
                <RichTextToolbarButton
                  label='Insert date'
                  icon={CalendarClockIcon}
                  run={(editor) =>
                    editor.chain().focus().insertTimestamp().run()
                  }
                />
              </RichTextToolbar>
            )}
            contentClassName='min-h-40'
          />
          <MarkdownView content={notes} className='rounded-lg border p-4' />
        </div>
      </section>
    </div>
  );
}
