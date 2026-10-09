import {
  Bold,
  Eraser,
  FileText,
  ImagePlus,
  Upload,
  Italic,
  Link2,
  List,
  ListOrdered,
  PenLine,
  Redo2,
  Underline,
  Undo2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';

import {
  editorImageHtml,
  serializeEditorImages,
} from '../lib/mail-editor-images.js';
import { htmlToPlainText, sanitizeMailHtml } from '../lib/mail-template.js';
import { setMailEditorHeading } from '../lib/mail-editor-headings.js';
import { MailImageResizer } from './mail-image-resizer.js';
import { Button } from './ui/button.js';
import { NativeSelect } from './ui/native-select.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';

export interface MailRichTextValue {
  readonly html: string;
  readonly text: string;
}

export interface MailRichTextEditorLabels {
  readonly toolbar: string;
  readonly bold: string;
  readonly italic: string;
  readonly underline: string;
  readonly bulletList: string;
  readonly numberedList: string;
  readonly undo: string;
  readonly redo: string;
  readonly clearFormatting: string;
  readonly fontSize?: string;
  readonly heading?: string;
  readonly link?: string;
  readonly image?: string;
  readonly uploadImage?: string;
  readonly resizeImage?: string;
  readonly deleteImage?: string;
  readonly normal?: string;
  readonly heading1?: string;
  readonly heading2?: string;
  readonly heading3?: string;
  readonly heading4?: string;
  readonly heading5?: string;
  readonly heading6?: string;
  readonly fontSizeSmall?: string;
  readonly fontSizeNormal?: string;
  readonly fontSizeLarge?: string;
}

export interface MailRichTextEditorInsertOption {
  readonly id: string;
  readonly label: string;
}

export interface MailRichTextEditorInsertMenu {
  readonly label: string;
  readonly options: readonly MailRichTextEditorInsertOption[];
  readonly emptyLabel?: string;
  readonly onSelect: (id: string) => void;
  readonly selectedId?: string;
}

export interface MailRichTextEditorInsertActions {
  readonly signature?: MailRichTextEditorInsertMenu;
  readonly template?: MailRichTextEditorInsertMenu;
}

export interface MailRichTextEditorProps {
  readonly imageSources?: Readonly<Record<string, string>>;
  readonly onUploadImage?: (
    file: File,
  ) => Promise<{ cid: string; src: string }>;
  readonly ariaLabel: string;
  readonly disabled?: boolean;
  readonly insertActions?: MailRichTextEditorInsertActions;
  readonly labels: MailRichTextEditorLabels;
  readonly onChange: (value: MailRichTextValue) => void;
  readonly placeholder?: string;
  readonly value: string;
}

const COMMANDS = [
  ['bold', Bold, 'bold'],
  ['italic', Italic, 'italic'],
  ['underline', Underline, 'underline'],
  ['insertUnorderedList', List, 'bulletList'],
  ['insertOrderedList', ListOrdered, 'numberedList'],
  ['undo', Undo2, 'undo'],
  ['redo', Redo2, 'redo'],
  ['removeFormat', Eraser, 'clearFormatting'],
] as const;

const FONT_SIZES = [10, 12, 14, 16, 18, 24, 32, 48] as const;

export function MailRichTextEditor({
  ariaLabel,
  imageSources,
  onUploadImage,
  disabled = false,
  insertActions,
  labels,
  onChange,
  placeholder,
  value,
}: MailRichTextEditorProps): ReactElement {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | undefined>(undefined);
  const pendingFontSizeRef = useRef('14');
  const [heading, setHeading] = useState('p');

  useEffect(() => {
    const syncHeading = (): void => {
      const editor = editorRef.current;
      const selection = window.getSelection();
      const node = selection?.focusNode;
      if (!editor || !node || !editor.contains(node)) return;
      const element = node instanceof Element ? node : node.parentElement;
      const block = element?.closest('h1,h2,h3,h4,h5,h6,p,div,li');
      setHeading(
        block && block !== editor && /^H[1-6]$/u.test(block.tagName)
          ? block.tagName.toLowerCase()
          : 'p',
      );
    };
    document.addEventListener('selectionchange', syncHeading);
    return () => document.removeEventListener('selectionchange', syncHeading);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const sanitized = editorImageHtml(value, imageSources ?? {});
    if (editor.innerHTML === sanitized) return;
    // Autosave can replace upload previews with draft attachment URLs. Update
    // only those attributes, preserving text nodes, selection and IME state.
    const next = document.createElement('div');
    next.innerHTML = sanitized;
    const candidate = editor.cloneNode(true) as HTMLElement;
    const images = [...next.querySelectorAll('img')];
    const updateSources = (container: HTMLElement): void => {
      container.querySelectorAll('img').forEach((image, index) => {
        const source = images[index]?.getAttribute('src');
        if (source === null || source === undefined)
          image.removeAttribute('src');
        else if (image.getAttribute('src') !== source)
          image.setAttribute('src', source);
      });
    };
    updateSources(candidate);
    if (candidate.innerHTML === sanitized) {
      updateSources(editor);
      return;
    }
    editor.innerHTML = sanitized;
  }, [value, imageSources]);

  const emitValue = (): void => {
    const editor = editorRef.current;
    if (!editor) return;
    // A collapsed selection applies the command to characters typed afterwards.
    for (const font of editor.querySelectorAll<HTMLElement>('font[size="7"]')) {
      font.style.fontSize = `${pendingFontSizeRef.current}px`;
      font.removeAttribute('size');
    }
    const html = serializeEditorImages(editor);
    onChange({ html, text: htmlToPlainText(html) });
  };

  const runCommand = (command: string, value?: string): void => {
    editorRef.current?.focus();
    document.execCommand?.(command, false, value);
    emitValue();
  };

  const insertSoftBreak = (): void => {
    editorRef.current?.focus();
    document.execCommand?.('insertHTML', false, '<br>');
    emitValue();
  };

  const setFontSize = (size: string): void => {
    const editor = editorRef.current;
    if (!editor) return;
    pendingFontSizeRef.current = size;
    editor.focus();
    // Reserve the largest legacy size as a marker without changing existing text.
    for (const font of editor.querySelectorAll<HTMLElement>('font[size="7"]')) {
      if (!font.style.fontSize) font.style.fontSize = '48px';
      font.removeAttribute('size');
    }
    document.execCommand?.('styleWithCSS', false, 'false');
    document.execCommand?.('fontSize', false, '7');
    emitValue();
  };

  const insertLink = (): void => {
    const url = window.prompt(labels.link ?? 'Insert link', 'https://');
    if (url?.trim()) runCommand('createLink', url.trim());
  };

  const insertImage = (): void => {
    const url = window.prompt(labels.image ?? 'Insert image', 'https://');
    if (url?.trim()) runCommand('insertImage', url.trim());
  };

  const uploadImage = async (file: File): Promise<void> => {
    if (!onUploadImage) return;
    try {
      const image = await onUploadImage(file);
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      const selection = window.getSelection();
      const range = selectionRef.current;
      if (range && editor.contains(range.commonAncestorContainer)) {
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      const node = document.createElement('img');
      node.src = image.src;
      node.alt = file.name;
      node.setAttribute('data-mail-cid', image.cid);
      const insertion = selection?.rangeCount
        ? selection.getRangeAt(0)
        : undefined;
      if (insertion && editor.contains(insertion.commonAncestorContainer)) {
        insertion.deleteContents();
        insertion.insertNode(node);
        insertion.setStartAfter(node);
        insertion.collapse(true);
      } else editor.append(node);
      emitValue();
    } catch {
      // The composer owns the upload error displayed to the user.
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  return (
    <div className='overflow-hidden rounded-lg border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50'>
      <div
        aria-label={labels.toolbar}
        className='flex flex-wrap items-center gap-1 border-b bg-muted/20 p-1'
        role='toolbar'
      >
        <NativeSelect
          aria-label={labels.heading ?? 'Heading level'}
          className='h-8 w-auto rounded-md border-0 bg-transparent px-1 pr-6 text-xs'
          value={heading}
          disabled={disabled}
          onChange={(event) => {
            if (!editorRef.current) return;
            setMailEditorHeading(editorRef.current, event.target.value);
            setHeading(event.target.value);
            emitValue();
          }}
          title={labels.heading ?? 'Heading level'}
        >
          <option value='p'>{labels.normal ?? 'Normal'}</option>
          <option value='h1'>{labels.heading1 ?? 'Heading 1'}</option>
          <option value='h2'>{labels.heading2 ?? 'Heading 2'}</option>
          <option value='h3'>{labels.heading3 ?? 'Heading 3'}</option>
          <option value='h4'>{labels.heading4 ?? 'Heading 4'}</option>
          <option value='h5'>{labels.heading5 ?? 'Heading 5'}</option>
          <option value='h6'>{labels.heading6 ?? 'Heading 6'}</option>
        </NativeSelect>
        <NativeSelect
          aria-label={labels.fontSize ?? 'Font size'}
          className='h-8 w-auto rounded-md border-0 bg-transparent px-1 pr-6 text-xs'
          defaultValue='14'
          disabled={disabled}
          onChange={(event) => setFontSize(event.target.value)}
          title={labels.fontSize ?? 'Font size'}
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={String(size)}>
              {size}
            </option>
          ))}
        </NativeSelect>
        {COMMANDS.map(([command, Icon, label]) => (
          <Button
            aria-label={labels[label]}
            className='size-8 px-0'
            disabled={disabled}
            key={command}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(command)}
            title={labels[label]}
            type='button'
            variant='ghost'
          >
            <Icon aria-hidden='true' className='size-4' />
          </Button>
        ))}
        <Button
          aria-label={labels.link ?? 'Insert link'}
          className='size-8 px-0'
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={insertLink}
          title={labels.link ?? 'Insert link'}
          type='button'
          variant='ghost'
        >
          <Link2 aria-hidden='true' className='size-4' />
        </Button>
        <Button
          aria-label={labels.image ?? 'Insert image'}
          className='size-8 px-0'
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={insertImage}
          title={labels.image ?? 'Insert image'}
          type='button'
          variant='ghost'
        >
          <ImagePlus aria-hidden='true' className='size-4' />
        </Button>
        {onUploadImage ? (
          <>
            <input
              ref={imageInputRef}
              type='file'
              accept='image/png,image/jpeg,image/gif,image/webp'
              className='sr-only'
              aria-label={labels.uploadImage ?? 'Upload image'}
              disabled={disabled}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage(file);
              }}
            />
            <Button
              aria-label={labels.uploadImage ?? 'Upload image'}
              title={labels.uploadImage ?? 'Upload image'}
              type='button'
              variant='ghost'
              className='size-8 px-0'
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                const selection = window.getSelection();
                selectionRef.current = selection?.rangeCount
                  ? selection.getRangeAt(0).cloneRange()
                  : undefined;
                imageInputRef.current?.click();
              }}
            >
              <Upload aria-hidden='true' className='size-4' />
            </Button>
          </>
        ) : null}
        {insertActions ? (
          <span aria-hidden='true' className='mx-1 h-5 w-px bg-border' />
        ) : null}
        {insertActions?.signature ? (
          <MailRichTextInsertMenu
            icon={<PenLine aria-hidden='true' className='size-3.5' />}
            menu={insertActions.signature}
            disabled={disabled}
          />
        ) : null}
        {insertActions?.template ? (
          <MailRichTextInsertMenu
            icon={<FileText aria-hidden='true' className='size-3.5' />}
            menu={insertActions.template}
            disabled={disabled}
          />
        ) : null}
      </div>
      <div className='relative'>
        <div
          aria-label={ariaLabel}
          aria-multiline='true'
          className='min-h-48 px-3 py-2 text-[14px] leading-6 outline-none empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&>div]:my-0 [&>div+div]:mt-2 [&>p]:my-0 [&>p+p]:mt-2 [&_img]:h-auto [&_img]:max-w-full [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_h1]:my-2 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:my-2 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:my-2 [&_h3]:text-xl [&_h3]:font-bold [&_h4]:my-2 [&_h4]:text-lg [&_h4]:font-bold [&_h5]:my-2 [&_h5]:text-base [&_h5]:font-bold [&_h6]:my-2 [&_h6]:text-sm [&_h6]:font-bold'
          contentEditable={!disabled}
          data-placeholder={placeholder}
          onInput={disabled ? undefined : emitValue}
          onKeyDown={
            disabled
              ? undefined
              : (event) => {
                  if (event.key !== 'Enter' || !event.shiftKey) return;
                  event.preventDefault();
                  insertSoftBreak();
                }
          }
          onPaste={(event) => {
            if (disabled) return;
            event.preventDefault();
            const html = sanitizeMailHtml(
              event.clipboardData.getData('text/html'),
            );
            if (html) document.execCommand?.('insertHTML', false, html);
            else
              document.execCommand?.(
                'insertText',
                false,
                event.clipboardData.getData('text/plain'),
              );
            emitValue();
          }}
          ref={editorRef}
          role='textbox'
          suppressContentEditableWarning
        />
        <MailImageResizer
          editorRef={editorRef}
          disabled={disabled}
          label={labels.resizeImage ?? 'Resize image'}
          deleteLabel={labels.deleteImage ?? 'Delete image'}
          onCommit={emitValue}
        />
      </div>
    </div>
  );
}

function MailRichTextInsertMenu({
  disabled = false,
  icon,
  menu,
}: {
  readonly disabled?: boolean;
  readonly icon: ReactElement;
  readonly menu: MailRichTextEditorInsertMenu;
}): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onMouseDown={(event) => event.preventDefault()}
        disabled={disabled}
        render={
          <Button
            aria-label={menu.label}
            className='h-8 px-2 text-xs'
            disabled={disabled}
            title={menu.label}
            type='button'
            variant='ghost'
          />
        }
      >
        {icon}
        <span>{menu.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='max-w-72'>
        {menu.options.length === 0 ? (
          <DropdownMenuItem disabled>
            {menu.emptyLabel ?? menu.label}
          </DropdownMenuItem>
        ) : (
          menu.options.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => menu.onSelect(option.id)}
            >
              <span
                aria-hidden='true'
                className='flex size-4 shrink-0 items-center justify-center text-primary'
              >
                {menu.selectedId === option.id ? '✓' : null}
              </span>
              <span className='truncate'>{option.label}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
