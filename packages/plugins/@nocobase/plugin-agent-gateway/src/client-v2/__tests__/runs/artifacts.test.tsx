/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { ArtifactContentPreview, sanitizeHtmlArtifactPreview } from '../../features/runs/artifacts/ArtifactsPanel';

describe('run artifact previews', () => {
  afterEach(cleanup);

  it('removes executable and network-capable content from HTML artifact previews', () => {
    const unsafeHtml = `<!doctype html>
      <html>
        <head>
          <base href="https://example.invalid/root/">
          <meta http-equiv="refresh" content="0;url=http://127.0.0.1/private">
          <link rel="stylesheet" href="http://127.0.0.1/private.css">
          <style>
            @import "https://example.invalid/import.css";
            @font-face { font-family: safe; src: url(data:font/woff2;base64,d09GRg==); }
            .remote { background-image: url(https://example.invalid/background.png); }
            .safe { color: red; background-image: url(data:image/png;base64,iVBORw0KGgo=); }
          </style>
        </head>
        <body onload="document.body.dataset.scriptMarker = 'executed'">
          <script>fetch('https://example.invalid/beacon'); parent.location = 'https://example.invalid/escape';</script>
          <form action="http://127.0.0.1/submit"><button formaction="https://example.invalid/form">Send</button></form>
          <iframe src="https://example.invalid/frame"></iframe>
          <object data="https://example.invalid/object"></object>
          <embed src="https://example.invalid/embed">
          <img id="remote-image" src="https://example.invalid/image.png" srcset="https://example.invalid/2x.png 2x">
          <img id="data-image" src="data:image/png;base64,iVBORw0KGgo=">
          <div id="safe-style" style="color: blue; background: url(data:image/png;base64,iVBORw0KGgo=)">safe</div>
          <div id="remote-style" style="background: url(http://127.0.0.1/pixel)">remote</div>
          <a href="https://example.invalid/navigation" ping="https://example.invalid/ping">link</a>
        </body>
      </html>`;

    const sanitizedHtml = sanitizeHtmlArtifactPreview(unsafeHtml);
    const document = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
    const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');

    expect(csp?.getAttribute('content')).toContain("default-src 'none'");
    expect(csp?.getAttribute('content')).toContain('img-src data:');
    expect(csp?.getAttribute('content')).toContain('font-src data:');
    expect(csp?.getAttribute('content')).toContain("style-src 'unsafe-inline'");
    expect(document.querySelector('script, base, form, iframe, object, embed, link')).toBeNull();
    expect(document.body.hasAttribute('onload')).toBe(false);
    expect(document.querySelector('#remote-image')?.hasAttribute('src')).toBe(false);
    expect(document.querySelector('#remote-image')?.hasAttribute('srcset')).toBe(false);
    expect(document.querySelector('#data-image')?.getAttribute('src')).toContain('data:image/png;base64,');
    expect(document.querySelector('#safe-style')?.getAttribute('style')).toContain('color: blue');
    expect(document.querySelector('#safe-style')?.getAttribute('style')).toContain('data:image/png;base64,');
    expect(document.querySelector('style')?.textContent).toContain('data:font/woff2;base64,');
    expect(document.querySelector('style')?.textContent).toContain('color: red');
    expect(document.querySelector('#remote-style')?.getAttribute('style')).not.toContain('127.0.0.1');
    expect(sanitizedHtml).not.toContain('example.invalid');
    expect(sanitizedHtml).not.toContain('127.0.0.1');
  });

  it('renders HTML artifacts in a restricted iframe and keeps raw text auditable', async () => {
    const unsafeHtml = `<meta http-equiv="refresh" content="0;url=https://example.invalid/next">
      <script>document.body.textContent = 'script-executed-marker'</script>
      <img src="https://example.invalid/image.png">
      <p style="color: green">raw-audit-marker</p>`;

    render(
      <ArtifactContentPreview
        artifact={{ id: 'html-artifact-id', artifactKey: 'report.html', mimeType: 'text/html' }}
        contentText={unsafeHtml}
        t={(key) => key}
      />,
    );

    expect(screen.getByText('Restricted HTML artifact preview')).toBeTruthy();
    expect(screen.getByText('Scripts, forms, navigation, and external network requests are disabled.')).toBeTruthy();
    const frame = screen.getByTitle('report.html: Restricted HTML artifact preview');
    expect(frame.getAttribute('sandbox')).toBe('');
    expect(frame.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(frame.getAttribute('srcdoc')).not.toContain('example.invalid');
    expect(frame.getAttribute('srcdoc')).not.toContain('<script');
    expect(screen.getByText('Raw artifact text')).toBeTruthy();

    fireEvent.click(screen.getByText('Raw artifact text'));
    expect(await screen.findByText(/raw-audit-marker/)).toBeTruthy();
    expect(await screen.findByText(/script-executed-marker/)).toBeTruthy();
  });

  it('keeps HTML size limits and ordinary text, JSON, and data-image previews working', () => {
    const oversizedHtml = `<p>visible-start</p>${'x'.repeat(25 * 1024)}<p>must-not-reach-preview</p>`;
    const t = (key: string) => key;

    const { unmount } = render(
      <ArtifactContentPreview
        artifact={{ id: 'large-html', artifactKey: 'large.html', mimeType: 'text/html' }}
        contentText={oversizedHtml}
        t={t}
      />,
    );
    expect(screen.getByText('Raw artifact text (truncated)')).toBeTruthy();
    expect(screen.getByTitle('large.html: Restricted HTML artifact preview').getAttribute('srcdoc')).not.toContain(
      'must-not-reach-preview',
    );

    unmount();
    const textPreview = render(
      <ArtifactContentPreview
        artifact={{ id: 'text-artifact', mimeType: 'text/plain' }}
        contentText="plain artifact text"
        t={t}
      />,
    );
    expect(screen.getByText('Readable text preview')).toBeTruthy();
    expect(screen.getByText('plain artifact text')).toBeTruthy();

    textPreview.unmount();
    const jsonPreview = render(
      <ArtifactContentPreview
        artifact={{ id: 'json-artifact', mimeType: 'application/json' }}
        contentText={'{"safe":true}'}
        t={t}
      />,
    );
    expect(screen.getByText('Readable JSON preview')).toBeTruthy();
    expect(screen.getByText(/"safe": true/)).toBeTruthy();

    jsonPreview.unmount();
    render(
      <ArtifactContentPreview
        artifact={{ id: 'image-artifact', artifactKey: 'preview.png', mimeType: 'image/png' }}
        contentText="data:image/png;base64,iVBORw0KGgo="
        t={t}
      />,
    );
    expect(screen.getByText('Image artifact preview')).toBeTruthy();
    expect(screen.getByAltText('preview.png').getAttribute('src')).toContain('data:image/png;base64,');
  });
});
