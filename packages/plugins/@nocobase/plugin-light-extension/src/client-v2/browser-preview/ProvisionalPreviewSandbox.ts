/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface ProvisionalPreviewSandboxResult {
  accepted: boolean;
  message?: string;
}

type SandboxResponse = {
  channel: string;
  accepted: boolean;
  message?: string;
};

const SANDBOX_SOURCE = `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' blob:; connect-src 'none'; img-src data: blob:; style-src 'unsafe-inline'">
  </head>
  <body>
    <script>
      const placeholder = new Proxy(function () {}, {
        apply: () => placeholder,
        construct: () => placeholder,
        get: (_target, property) => {
          if (property === 'then') return undefined;
          if (property === 'toJSON') return () => '[provisional-preview-value]';
          if (property === Symbol.toPrimitive) return () => '';
          return placeholder;
        },
      });
      globalThis.ctx = new Proxy({
        libs: placeholder,
        React: { createElement: (...args) => ({ provisionalElement: args }), Fragment: 'fragment' },
        render: () => undefined,
        t: (value) => String(value),
      }, { get: (target, property) => property in target ? target[property] : placeholder });
      window.addEventListener('message', (event) => {
        const request = event.data;
        if (!request || request.type !== 'execute-provisional-preview') return;
        const bundleURL = URL.createObjectURL(new Blob([request.code], { type: 'text/javascript' }));
        const script = document.createElement('script');
        script.src = bundleURL;
        script.onload = () => {
          URL.revokeObjectURL(bundleURL);
          Promise.resolve(globalThis.__nocobaseProvisionalPreviewRun__?.())
            .then(() => parent.postMessage({ channel: request.channel, accepted: true }, '*'))
            .catch((error) => parent.postMessage({ channel: request.channel, accepted: false, message: String(error?.message || error) }, '*'));
        };
        script.onerror = () => {
          URL.revokeObjectURL(bundleURL);
          parent.postMessage({ channel: request.channel, accepted: false, message: 'Failed to load provisional preview bundle' }, '*');
        };
        document.body.appendChild(script);
      });
    </script>
  </body>
</html>`;

export class ProvisionalPreviewSandbox {
  private iframe: HTMLIFrameElement | null = null;
  private iframeReady: Promise<void> | null = null;
  private requestSequence = 0;

  async execute(code: string, timeoutMs = 3000): Promise<ProvisionalPreviewSandboxResult> {
    if (typeof document === 'undefined') {
      return { accepted: true };
    }
    const iframe = this.ensureIframe();
    await this.iframeReady;
    const channel = `light-extension-provisional-preview-${++this.requestSequence}`;
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: ProvisionalPreviewSandboxResult) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        window.removeEventListener('message', onMessage);
        resolve(result);
      };
      const onMessage = (event: MessageEvent<SandboxResponse>) => {
        if (event.source !== iframe.contentWindow || event.data?.channel !== channel) {
          return;
        }
        finish({ accepted: event.data.accepted, message: event.data.message });
      };
      const timeout = setTimeout(
        () => finish({ accepted: false, message: 'Provisional preview sandbox timed out' }),
        timeoutMs,
      );
      window.addEventListener('message', onMessage);
      iframe.contentWindow?.postMessage({ type: 'execute-provisional-preview', channel, code }, '*');
    });
  }

  dispose(): void {
    this.iframe?.remove();
    this.iframe = null;
    this.iframeReady = null;
  }

  private ensureIframe(): HTMLIFrameElement {
    if (this.iframe) {
      return this.iframe;
    }
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.srcdoc = SANDBOX_SOURCE;
    iframe.style.display = 'none';
    this.iframeReady = new Promise((resolve) => {
      const timeout = setTimeout(resolve, 1000);
      iframe.addEventListener(
        'load',
        () => {
          clearTimeout(timeout);
          resolve();
        },
        { once: true },
      );
    });
    document.body.appendChild(iframe);
    this.iframe = iframe;
    return iframe;
  }
}
