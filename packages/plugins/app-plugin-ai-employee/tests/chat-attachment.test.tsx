/**
 * @vitest-environment jsdom
 */

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatAttachment } from '../registry/nocobase-ai/components/chat/chat-attachment.js';

describe('ChatAttachment', () => {
  it('does not render a non-image preview as an image', () => {
    const { container, getByText } = render(
      <ChatAttachment
        attachment={{
          uid: 'markdown-file',
          filename: 'notes.md',
          status: 'done',
          mimetype: 'text/markdown',
          preview: 'blob:markdown-preview',
          size: 128,
        }}
      />,
    );

    expect(getByText('notes.md')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders an image preview for image MIME types', () => {
    const { container } = render(
      <ChatAttachment
        attachment={{
          uid: 'image-file',
          filename: 'photo.png',
          status: 'done',
          mimetype: 'image/png',
          preview: 'blob:image-preview',
        }}
      />,
    );

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'blob:image-preview',
    );
  });
});
