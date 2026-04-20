/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Local HTTP wizard for `nb init --ui`: binds a TCP server (default 0.0.0.0, ephemeral port) and returns user choices.
 */
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const WIZARD_TIMEOUT_MS = 600_000;

/** Avoid hanging on `server.close()`: browsers keep HTTP/1.1 connections alive after GET /, so close waits until idle timeout unless we close sockets. */
function closeWizardServer(server: http.Server, onClosed: () => void): void {
  server.close(onClosed);
  server.closeAllConnections?.();
}

/**
 * Host fragment for `http://…` (not `0.0.0.0` / `::`).
 */
function wizardUrlHost(bindHost: string): string {
  if (bindHost === '0.0.0.0' || bindHost === '::') {
    return '127.0.0.1';
  }
  return formatHostForHttpUrl(bindHost);
}

function formatHostForHttpUrl(host: string): string {
  if (host.includes(':') && !(host.startsWith('[') && host.endsWith(']'))) {
    return `[${host}]`;
  }
  return host;
}

function wizardOpenUrl(bindHost: string, port: number): string {
  return `http://${wizardUrlHost(bindHost)}:${port}/`;
}

function initWizardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Initialize the NocoBase AI setup environment</title>
  <style>
    :root { font-family: system-ui, sans-serif; color: #0f172a; background: #f8fafc; }
    body { max-width: 36rem; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1.35rem; font-weight: 600; margin-bottom: 0.25rem; }
    p.sub { color: #64748b; font-size: 0.9rem; margin-top: 0; margin-bottom: 1.5rem; }
    fieldset { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem 1.1rem; margin: 0 0 1rem; background: #fff; }
    legend { font-weight: 600; padding: 0 0.35rem; }
    label.opt { display: flex; gap: 0.6rem; align-items: flex-start; margin: 0.5rem 0; cursor: pointer; }
    label.opt input { margin-top: 0.2rem; }
    label.field { display: block; margin: 0.65rem 0; }
    label.field span { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem; }
    input.txt { width: 100%; max-width: 100%; box-sizing: border-box; font: inherit; padding: 0.45rem 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; }
    .actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.25rem; }
    button { font: inherit; padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; }
    button.primary { background: #2563eb; color: #fff; }
    button.primary:hover { background: #1d4ed8; }
    button.secondary { background: #e2e8f0; color: #334155; }
    button.secondary:hover { background: #cbd5e1; }
    #status { margin-top: 1rem; font-size: 0.9rem; min-height: 1.25rem; }
    #status.err { color: #b91c1c; }
    #status.ok { color: #15803d; }
    #status.wait { color: #b45309; }
    button:disabled { opacity: 0.65; cursor: not-allowed; }
    #envPanel { display: none; }
    #envPanel.visible { display: block; }
    #tokenRow { display: none; }
    #tokenRow.visible { display: block; }
    .hint { font-size: 0.8rem; color: #64748b; margin-top: 0.15rem; }
  </style>
</head>
<body>
  <h1>Initialize the NocoBase AI setup environment</h1>
  <p class="sub">Pick your options and submit. This page only talks to the <code>nb init</code> process on your machine (<code>127.0.0.1</code>).</p>
  <form id="f">
    <fieldset>
      <legend>Agent skills</legend>
      <label class="opt">
        <input type="checkbox" name="installSkills" id="installSkills" checked />
        <span>Install NocoBase agent skills (<code>nocobase/skills</code>) for Cursor and Codex</span>
      </label>
    </fieldset>
    <fieldset>
      <legend>What happens next</legend>
      <label class="opt">
        <input type="radio" name="path" value="install" checked />
        <span>New project — run <strong>nb install</strong> (full setup in the terminal)</span>
      </label>
      <label class="opt">
        <input type="radio" name="path" value="env_add" />
        <span>Existing deployment — run <strong>nb env add</strong> (fill in the section below)</span>
      </label>
    </fieldset>
    <div id="envPanel">
      <fieldset>
        <legend>CLI environment</legend>
        <p class="sub" style="margin-bottom:0.75rem">Matches the terminal prompts for <code>nb env add</code>. Values are sent to the CLI when you click Continue.</p>
        <label class="field">
          <span>Environment name</span>
          <input class="txt" type="text" id="envName" value="default" autocomplete="off" />
        </label>
        <fieldset>
          <legend>Where to store this env</legend>
          <label class="opt">
            <input type="radio" name="scope" value="project" checked />
            <span>Project <span class="hint"><code>.nocobase</code> in this directory</span></span>
          </label>
          <label class="opt">
            <input type="radio" name="scope" value="global" />
            <span>Global <span class="hint">your user config</span></span>
          </label>
        </fieldset>
        <label class="field">
          <span>API base URL</span>
          <input class="txt" type="url" id="apiBaseUrl" value="http://localhost:13000/api" autocomplete="off" />
        </label>
        <fieldset>
          <legend>Authentication</legend>
          <label class="opt">
            <input type="radio" name="authType" value="oauth" checked />
            <span>OAuth — after saving, the CLI runs <code>nb env auth</code></span>
          </label>
          <label class="opt">
            <input type="radio" name="authType" value="token" />
            <span>Token — API key or bearer token</span>
          </label>
        </fieldset>
        <div id="tokenRow">
          <label class="field">
            <span>Access token / API key</span>
            <input class="txt" type="password" id="accessToken" autocomplete="off" />
          </label>
        </div>
      </fieldset>
    </div>
    <div class="actions">
      <button type="submit" class="primary" id="btnContinue">Continue</button>
      <button type="button" class="secondary" id="cancel">Cancel</button>
    </div>
  </form>
  <p id="status"></p>
  <script>
    const status = document.getElementById('status');
    const envPanel = document.getElementById('envPanel');
    const tokenRow = document.getElementById('tokenRow');
    function setErr(msg) { status.className = 'err'; status.textContent = msg; }
    function setOk(msg) { status.className = 'ok'; status.textContent = msg; }
    function setWait(msg) { status.className = 'wait'; status.textContent = msg; }
    function syncPath() {
      const path = document.querySelector('input[name="path"]:checked').value;
      envPanel.classList.toggle('visible', path === 'env_add');
    }
    function syncAuth() {
      const t = document.querySelector('input[name="authType"]:checked').value;
      tokenRow.classList.toggle('visible', t === 'token');
    }
    document.querySelectorAll('input[name="path"]').forEach(function (el) {
      el.addEventListener('change', syncPath);
    });
    document.querySelectorAll('input[name="authType"]').forEach(function (el) {
      el.addEventListener('change', syncAuth);
    });
    syncPath();
    syncAuth();
    document.getElementById('f').addEventListener('submit', async function (e) {
      e.preventDefault();
      const btnContinue = document.getElementById('btnContinue');
      const btnCancel = document.getElementById('cancel');
      const installSkills = document.getElementById('installSkills').checked;
      const path = document.querySelector('input[name="path"]:checked').value;
      const hasNocobase = path === 'env_add';
      let envAdd = undefined;
      if (hasNocobase) {
        const envName = document.getElementById('envName').value.trim();
        const scope = document.querySelector('input[name="scope"]:checked').value;
        const apiBaseUrl = document.getElementById('apiBaseUrl').value.trim();
        const authType = document.querySelector('input[name="authType"]:checked').value;
        const accessToken = document.getElementById('accessToken').value.trim();
        if (!envName) { setErr('Please enter an environment name.'); return; }
        if (!apiBaseUrl) { setErr('Please enter the API base URL.'); return; }
        if (authType === 'token' && !accessToken) { setErr('Please enter an access token for token authentication.'); return; }
        envAdd = {
          envName: envName,
          scope: scope,
          apiBaseUrl: apiBaseUrl,
          authType: authType,
          accessToken: authType === 'token' ? accessToken : undefined,
        };
      }
      btnContinue.disabled = true;
      btnCancel.disabled = true;
      setWait('Submitting to the CLI…');
      try {
        const r = await fetch('/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ installSkills, hasNocobase, envAdd }),
        });
        const data = await r.json().catch(function () { return {}; });
        if (!r.ok) throw new Error(data.error || 'Request failed');
        setOk(
          'Submitted. Continue in your terminal. This window will try to close automatically in 5 seconds.',
        );
        setTimeout(function () {
          window.close();
          setTimeout(function () {
            if (document.visibilityState === 'visible') {
              setOk(
                'This tab could not be closed automatically. Please close it manually—the CLI is still running in your terminal.',
              );
            }
          }, 600);
        }, 5000);
      } catch (err) {
        setErr(err.message || 'Could not reach the CLI. Keep this terminal command running: nb init --ui');
        btnContinue.disabled = false;
        btnCancel.disabled = false;
      }
    });
    document.getElementById('cancel').addEventListener('click', async function () {
      try {
        await fetch('/cancel', { method: 'POST' });
      } catch (_) {}
      setOk('Cancelled. You may close this tab.');
    });
  </script>
</body>
</html>`;
}

export async function openBrowser(url: string): Promise<boolean> {
  try {
    if (process.platform === 'darwin') {
      await execFileAsync('open', [url]);
    } else if (process.platform === 'win32') {
      await execFileAsync('cmd', ['/c', 'start', '', url]);
    } else {
      await execFileAsync('xdg-open', [url]);
    }
    return true;
  } catch {
    return false;
  }
}

/** Fields collected in the browser for \`nb env add\` (mirrors interactive env:add). */
export type InitBrowserEnvAddFields = {
  envName: string;
  scope: 'project' | 'global';
  apiBaseUrl: string;
  authType: 'token' | 'oauth';
  accessToken?: string;
};

export type InitBrowserChoice = {
  installSkills: boolean;
  hasNocobase: boolean;
  /** Set when \`hasNocobase\` — passed as \`nb env add\` argv so the terminal wizard is skipped. */
  envAdd?: InitBrowserEnvAddFields;
};

export class InitWizardCancelledError extends Error {
  constructor() {
    super('Init cancelled from browser.');
    this.name = 'InitWizardCancelledError';
  }
}

function parseAndValidateSubmit(raw: string): InitBrowserChoice {
  const data = JSON.parse(raw) as {
    installSkills?: unknown;
    hasNocobase?: unknown;
    envAdd?: unknown;
  };
  const installSkills = Boolean(data.installSkills);
  const hasNocobase = Boolean(data.hasNocobase);

  if (!hasNocobase) {
    return { installSkills, hasNocobase: false };
  }

  const ea = data.envAdd;
  if (!ea || typeof ea !== 'object') {
    throw new Error('Environment fields are required when you choose an existing deployment.');
  }
  const rec = ea as Record<string, unknown>;
  const envName = typeof rec.envName === 'string' ? rec.envName.trim() : '';
  const scope = rec.scope === 'global' || rec.scope === 'project' ? rec.scope : '';
  const apiBaseUrl = typeof rec.apiBaseUrl === 'string' ? rec.apiBaseUrl.trim() : '';
  const authType = rec.authType === 'token' || rec.authType === 'oauth' ? rec.authType : '';
  const accessToken =
    typeof rec.accessToken === 'string' && rec.accessToken.trim() ? rec.accessToken.trim() : undefined;

  if (!envName) {
    throw new Error('Environment name cannot be empty.');
  }
  if (!scope) {
    throw new Error('Choose project or global scope.');
  }
  if (!apiBaseUrl) {
    throw new Error('API base URL cannot be empty.');
  }
  if (!authType) {
    throw new Error('Choose token or OAuth authentication.');
  }
  if (authType === 'token' && !accessToken) {
    throw new Error('Token authentication requires an access token.');
  }

  return {
    installSkills,
    hasNocobase: true,
    envAdd: {
      envName,
      scope,
      apiBaseUrl,
      authType,
      ...(authType === 'token' ? { accessToken } : {}),
    },
  };
}

function buildEnvAddArgv(fields: InitBrowserEnvAddFields): string[] {
  const argv = [
    fields.envName,
    '--scope',
    fields.scope,
    '--api-base-url',
    fields.apiBaseUrl,
    '--auth-type',
    fields.authType,
  ];
  if (fields.authType === 'token' && fields.accessToken) {
    argv.push('--access-token', fields.accessToken);
  }
  return argv;
}

export { buildEnvAddArgv };

export type RunInitBrowserWizardOptions = {
  /** Address passed to `server.listen` (e.g. `0.0.0.0`, `127.0.0.1`). */
  bindHost?: string;
  /** TCP port; `0` lets the OS assign a free port. */
  port?: number;
};

function resolveWizardListenOptions(options?: RunInitBrowserWizardOptions): {
  bindHost: string;
  port: number;
} {
  const bindHost = options?.bindHost?.trim() || '0.0.0.0';
  let port: number;
  if (options?.port !== undefined) {
    port = options.port;
  } else if (process.env.NOCOBASE_INIT_UI_PORT !== undefined) {
    const n = Number(process.env.NOCOBASE_INIT_UI_PORT);
    port = Number.isFinite(n) ? n : 0;
  } else {
    port = 0;
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('Wizard port must be an integer from 0 to 65535 (0 = random).');
  }
  return { bindHost, port };
}

/**
 * Binds a local HTTP server, opens the wizard URL, resolves when the form is submitted
 * (then closes the server). The CLI continues in the terminal.
 */
export function runInitBrowserWizard(
  log: (line: string) => void,
  options?: RunInitBrowserWizardOptions,
): Promise<InitBrowserChoice> {
  const { bindHost, port: listenPort } = resolveWizardListenOptions(options);
  const html = initWizardHtml();
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      closeWizardServer(server, () => {
        reject(new Error('Browser wizard timed out after 10 minutes with no submission.'));
      });
    }, WIZARD_TIMEOUT_MS);

    function done(choice: InitBrowserChoice): void {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      closeWizardServer(server, () => resolve(choice));
    }

    function fail(err: Error): void {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      closeWizardServer(server, () => reject(err));
    }

    const server = http.createServer((req, res) => {
      const u = new URL(req.url ?? '/', 'http://127.0.0.1');

      if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/index.html')) {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          Connection: 'close',
        });
        res.end(html);
        return;
      }

      if (req.method === 'POST' && u.pathname === '/cancel') {
        res.writeHead(200, { 'Content-Type': 'application/json', Connection: 'close' });
        res.end(JSON.stringify({ ok: true }), () => {
          fail(new InitWizardCancelledError());
        });
        return;
      }

      if (req.method === 'POST' && u.pathname === '/submit') {
        let raw = '';
        req.on('data', (c) => {
          raw += c;
        });
        req.on('end', () => {
          try {
            const choice = parseAndValidateSubmit(raw);
            res.writeHead(200, { 'Content-Type': 'application/json', Connection: 'close' });
            res.end(JSON.stringify({ ok: true }), () => {
              done(choice);
            });
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Invalid submission.';
            res.writeHead(400, {
              'Content-Type': 'application/json; charset=utf-8',
              Connection: 'close',
            });
            res.end(JSON.stringify({ ok: false, error: msg }));
          }
        });
        return;
      }

      res.writeHead(404, { Connection: 'close' }).end();
    });

    server.on('error', (err) => {
      fail(err instanceof Error ? err : new Error(String(err)));
    });

    server.listen(listenPort, bindHost, async () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        fail(new Error('Failed to bind local wizard server.'));
        return;
      }
      const openUrl = wizardOpenUrl(bindHost, addr.port);
      log(`Local wizard: ${openUrl}`);
      const opened = await openBrowser(openUrl);
      if (!opened) {
        log('Could not open a browser automatically. Open the URL above manually.');
      }
    });
  });
}
