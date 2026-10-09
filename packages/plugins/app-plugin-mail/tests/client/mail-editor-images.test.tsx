import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { MailRichTextEditor } from '../../client/components/mail-rich-text-editor.js';
import {
  removeEditorImage,
  editorImageHtml,
  serializeEditorImages,
} from '../../client/lib/mail-editor-images.js';
import { uploadedImageMetadata } from '../../shared/inline-images.js';

const labels = {
  toolbar: 'Format',
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  bulletList: 'List',
  numberedList: 'Numbered list',
  undo: 'Undo',
  redo: 'Redo',
  clearFormatting: 'Clear',
};

it('previews reopened CID images and preserves CID while editing without persisting protected URLs', () => {
  const change = vi.fn();
  render(
    <MailRichTextEditor
      ariaLabel='Body'
      labels={labels}
      value='<img src="cid:logo" alt="Logo"><p>Text</p>'
      imageSources={{ 'cid:logo': '/api/mail/attachments/owned' }}
      onChange={change}
    />,
  );
  expect(screen.getByAltText('Logo')).toHaveAttribute(
    'src',
    '/api/mail/attachments/owned',
  );
  fireEvent.input(screen.getByRole('textbox'));
  expect(change.mock.calls[0][0].html).toContain('src="cid:logo"');
  expect(change.mock.calls[0][0].html).not.toContain('/api/');
});

it('uploads an image and inserts its preview while emitting portable HTML', async () => {
  const change = vi.fn();
  const upload = vi.fn(async () => ({
    cid: 'cid:new',
    src: '/api/mail/attachments/new',
  }));
  render(
    <MailRichTextEditor
      ariaLabel='Body'
      labels={labels}
      value=''
      onChange={change}
      onUploadImage={upload}
    />,
  );
  const input = document.querySelector('input[type=file]')!;
  fireEvent.change(input, {
    target: {
      files: [new File(['image'], 'image.png', { type: 'image/png' })],
    },
  });
  await waitFor(() =>
    expect(screen.getByAltText('image.png')).toHaveAttribute(
      'src',
      '/api/mail/attachments/new',
    ),
  );
  expect(change.mock.calls[0][0].html).toContain('src="cid:new"');
  expect(change.mock.calls[0][0].html).not.toContain('/api/');
});

it('keeps unresolved CIDs portable without loading untrusted URLs', () => {
  const editor = document.createElement('div');
  editor.innerHTML = editorImageHtml('<img src="cid:missing">', {});
  expect(editor.querySelector('img')).not.toHaveAttribute('src');
  expect(serializeEditorImages(editor)).toBe('<img src="cid:missing">');
});

it('only sends referenced image uploads inline', () => {
  const html = '<img src="cid:nocobase-upload@mail.inline">';
  expect(uploadedImageMetadata('upload', 'image/png', html)).toEqual({
    inline: true,
    contentId: 'nocobase-upload@mail.inline',
  });
  expect(uploadedImageMetadata('other', 'image/png', html)).toEqual({
    inline: false,
  });
  expect(uploadedImageMetadata('upload', 'text/html', html)).toEqual({
    inline: false,
  });
});

it('removes only the deleted attachment image from the body', () => {
  expect(
    removeEditorImage(
      '<p>Text</p><img src="cid:removed"><img src="cid:kept">',
      '<removed>',
    ),
  ).toBe('<p>Text</p><img src="cid:kept">');
});

it('resizes proportionally and preserves dimensions with CID after reopening', () => {
  const change = vi.fn();
  const props = {
    ariaLabel: 'Body',
    labels,
    imageSources: { 'cid:logo': '/api/mail/attachments/owned' },
    onChange: change,
  };
  const { rerender } = render(
    <MailRichTextEditor {...props} value='<img src="cid:logo" alt="Logo">' />,
  );
  const image = screen.getByAltText('Logo');
  vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 200,
    bottom: 100,
    width: 200,
    height: 100,
    toJSON: () => ({}),
  });
  fireEvent.click(image);
  const handle = screen.getByRole('button', { name: 'Resize image' });
  fireEvent.keyDown(handle, { key: 'ArrowRight', shiftKey: true });
  expect(image).toHaveAttribute('width', '210');
  expect(image).toHaveAttribute('height', '105');
  const html = change.mock.calls[0][0].html as string;
  expect(html).toContain('src="cid:logo"');
  expect(html).toContain('width="210"');
  expect(html).not.toContain('button');
  expect(html).not.toContain('/api/');
  rerender(<MailRichTextEditor {...props} value={html} />);
  expect(screen.getByAltText('Logo')).toHaveAttribute('width', '210');
  expect(screen.getByAltText('Logo')).toHaveAttribute('height', '105');
  rerender(<MailRichTextEditor {...props} value={html} disabled />);
  expect(
    screen.queryByRole('button', { name: 'Resize image' }),
  ).not.toBeInTheDocument();
});

it('drags the image handle, commits once and cancels without emitting a change', () => {
  const change = vi.fn();
  render(
    <MailRichTextEditor
      ariaLabel='Body'
      labels={labels}
      value='<img src="https://example.com/image.png" alt="Drag">'
      onChange={change}
    />,
  );
  const image = screen.getByAltText('Drag');
  vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 200,
    bottom: 100,
    width: 200,
    height: 100,
    toJSON: () => ({}),
  });
  fireEvent.click(image);
  const handle = screen.getByRole('button', { name: 'Resize image' });
  handle.setPointerCapture = vi.fn();
  handle.releasePointerCapture = vi.fn();
  const pointer = (type: string, x: number): void => {
    fireEvent(
      handle,
      new MouseEvent(type, {
        bubbles: true,
        clientX: x,
        clientY: 0,
        button: 0,
      }),
    );
  };
  pointer('pointerdown', 200);
  pointer('pointermove', 300);
  expect(image).toHaveAttribute('width', '300');
  expect(image).toHaveAttribute('height', '150');
  expect(change).not.toHaveBeenCalled();
  pointer('pointerup', 300);
  expect(change).toHaveBeenCalledTimes(1);
  pointer('pointerdown', 300);
  pointer('pointermove', 350);
  pointer('pointercancel', 350);
  expect(image).toHaveAttribute('width', '300');
  expect(image).toHaveAttribute('height', '150');
  expect(change).toHaveBeenCalledTimes(1);
});

it('retains safe dimensions but strips invalid dimensions and arbitrary styling', () => {
  const editor = document.createElement('div');
  editor.innerHTML =
    '<img src="cid:logo" width="320" height="160" style="position:fixed"><img width="-1" height="999999">';
  expect(serializeEditorImages(editor)).toBe(
    '<img src="cid:logo" width="320" height="160"><img>',
  );
});

it('updates autosaved inline image previews without replacing text or selection', () => {
  const props = {
    ariaLabel: 'Body',
    labels,
    onChange: vi.fn(),
    value: '<p>Keep typing<img src="cid:logo" alt="Logo"></p>',
  };
  const { rerender } = render(
    <MailRichTextEditor
      {...props}
      imageSources={{ 'cid:logo': '/api/mail/attachments/upload' }}
    />,
  );
  const editor = screen.getByRole('textbox', { name: 'Body' });
  editor.focus();
  const text = editor.querySelector('p')!.firstChild!;
  window.getSelection()!.setPosition(text, 5);
  const image = screen.getByAltText('Logo');
  rerender(
    <MailRichTextEditor
      {...props}
      imageSources={{
        'cid:logo':
          '/api/mail/accounts/account-1/messages/draft-1/attachments/image',
      }}
    />,
  );
  expect(screen.getByAltText('Logo')).toBe(image);
  expect(image).toHaveAttribute(
    'src',
    '/api/mail/accounts/account-1/messages/draft-1/attachments/image',
  );
  expect(editor.querySelector('p')!.firstChild).toBe(text);
  expect(window.getSelection()!.anchorNode).toBe(text);
  expect(window.getSelection()!.anchorOffset).toBe(5);
  expect(document.activeElement).toBe(editor);
});

it('deletes a selected image inside the editor and emits the remaining body', () => {
  const change = vi.fn();
  render(
    <MailRichTextEditor
      ariaLabel='Body'
      labels={labels}
      value='<p>Keep this</p><img src="cid:logo" alt="Delete me">'
      onChange={change}
    />,
  );
  const image = screen.getByAltText('Delete me');
  vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 200,
    bottom: 100,
    width: 200,
    height: 100,
    toJSON: () => ({}),
  });
  fireEvent.click(image);
  fireEvent.click(screen.getByRole('button', { name: 'Delete image' }));
  expect(screen.queryByAltText('Delete me')).not.toBeInTheDocument();
  expect(change).toHaveBeenCalledWith({
    html: '<p>Keep this</p>',
    text: 'Keep this',
  });
});
