/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { chromium, Request } from 'playwright';

import {
  AdminScriptArgs,
  JsonRecord,
  getListItems,
  getString,
  parseAdminArgs,
  parseAdminFlags,
  requestJson,
  signIn,
} from './terminal-stream-smoke-script-utils';

interface VerifyReadonlyXtermArgs extends AdminScriptArgs {
  runId: string;
  runUrl: string;
  xtermSelector: string;
  marker: string;
  captureNetwork: boolean;
  timeoutMs: number;
  headed: boolean;
}

interface CapturedHttpRequest {
  method: string;
  url: string;
  postData: string;
}

const RAW_WS_FRAME_TOKENS = [
  'terminal.write',
  'terminal.send',
  'terminal.input',
  'browser.input',
  'browser.write',
  'stdin',
];

const RAW_HTTP_PATH_PATTERN = /terminal:(send|write|input)|terminal\/(send|write|input)|raw-?terminal/i;

function printHelp() {
  process.stdout.write(`Usage:
  yarn tsx packages/plugins/@nocobase/plugin-agent-gateway/scripts/verify-readonly-xterm-input.ts \\
    --base-url http://127.0.0.1:23000 \\
    --run-id <run-id> \\
    --run-url <run-detail-url> \\
    --xterm-selector "[data-testid=agent-gateway-readonly-xterm]" \\
    --marker AGENT_GATEWAY_RAW_INPUT_HELPER_SHOULD_NOT_SEND \\
    --capture-network \\
    --admin-email admin@nocobase.com \\
    --admin-password admin123

Options:
  --timeout-ms <ms>  Browser wait timeout. Default: 30000.
  --headed           Run Chromium headed.
  --help             Show this help.
`);
}

function parseArgs(argv: string[]): VerifyReadonlyXtermArgs {
  const { booleanFlags, flags } = parseAdminFlags(argv);
  if (booleanFlags.has('help')) {
    printHelp();
    process.exit(0);
  }
  const adminArgs = parseAdminArgs(argv);
  const runId = getString(flags['run-id']);
  const runUrl = getString(flags['run-url']);
  const xtermSelector = getString(flags['xterm-selector']);
  const marker = getString(flags.marker);
  if (!runId || !runUrl || !xtermSelector || !marker) {
    throw new Error('--run-id, --run-url, --xterm-selector, and --marker are required');
  }
  return {
    ...adminArgs,
    runId,
    runUrl,
    xtermSelector,
    marker,
    captureNetwork: booleanFlags.has('capture-network'),
    timeoutMs: Number(getString(flags['timeout-ms']) || 30_000),
    headed: booleanFlags.has('headed'),
  };
}

function stringifyPayload(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value) || '';
  } catch {
    return String(value);
  }
}

function isRawWriteWebSocketPayload(payload: string) {
  const lowerPayload = payload.toLowerCase();
  if (RAW_WS_FRAME_TOKENS.some((token) => lowerPayload.includes(token))) {
    return true;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload) as unknown;
  } catch {
    return false;
  }
  const record = parsed && typeof parsed === 'object' ? (parsed as JsonRecord) : {};
  const type = getString(record.type).toLowerCase();
  const action = getString(record.action).toLowerCase();
  const target = getString(record.target).toLowerCase();
  return RAW_WS_FRAME_TOKENS.some((token) => type === token || action === token || target.includes(token));
}

function isRawWriteHttpRequest(request: CapturedHttpRequest) {
  if (RAW_HTTP_PATH_PATTERN.test(request.url)) {
    return true;
  }
  const payload = request.postData.toLowerCase();
  return RAW_WS_FRAME_TOKENS.some((token) => payload.includes(token));
}

async function listRecords(baseUrl: string, token: string, collection: string, filter: JsonRecord) {
  const search = new URLSearchParams();
  search.set('filter', JSON.stringify(filter));
  search.set('pageSize', '200');
  const data = await requestJson<unknown>(baseUrl, `/api/${collection}:list?${search.toString()}`, {
    token,
  });
  return getListItems(data);
}

async function countControlRecords(baseUrl: string, token: string, runId: string) {
  const events = await listRecords(baseUrl, token, 'agRunEvents', {
    runId,
    source: 'terminal-control',
  });
  return {
    terminalControlEvents: events.length,
    total: events.length,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const token = await signIn(args);
  const beforeRecords = await countControlRecords(args.baseUrl, token, args.runId);
  const browser = await chromium.launch({ headless: !args.headed });
  const context = await browser.newContext();
  await context.addInitScript(
    ({ authToken }) => {
      window.localStorage.setItem('NOCOBASE_TOKEN', authToken);
      window.localStorage.setItem('NOCOBASE_AUTH', 'basic');
      window.localStorage.setItem('NOCOBASE_ROLE', 'root');
      window.localStorage.setItem('NOCOBASE_LOCALE', 'en-US');
    },
    { authToken: token },
  );
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');

  const websocketFrames: string[] = [];
  const httpRequests: CapturedHttpRequest[] = [];
  let captureTypingWindow = false;

  if (args.captureNetwork) {
    cdp.on('Network.webSocketFrameSent', (event: { response?: { payloadData?: string } }) => {
      if (!captureTypingWindow) {
        return;
      }
      websocketFrames.push(event.response?.payloadData || '');
    });
    page.on('request', (request: Request) => {
      if (!captureTypingWindow) {
        return;
      }
      httpRequests.push({
        method: request.method(),
        url: request.url(),
        postData: request.postData() || '',
      });
    });
  }

  try {
    await page.goto(args.runUrl, { waitUntil: 'domcontentloaded', timeout: args.timeoutMs });
    const xterm = page.locator(args.xtermSelector).first();
    await xterm.waitFor({ state: 'visible', timeout: args.timeoutMs });
    await xterm.click({ position: { x: 24, y: 24 } });

    captureTypingWindow = true;
    await page.keyboard.type(args.marker);
    await page.waitForTimeout(1000);
    captureTypingWindow = false;

    const terminalText = (await xterm.innerText({ timeout: args.timeoutMs })).trim();
    const afterRecords = await countControlRecords(args.baseUrl, token, args.runId);
    const rawWriteWebSocketFrames = websocketFrames.filter(isRawWriteWebSocketPayload);
    const rawWriteHttpRequests = httpRequests.filter(isRawWriteHttpRequest);
    const markerMatchingPayloads = [
      ...websocketFrames.filter((frame) => frame.includes(args.marker)),
      ...httpRequests
        .map((request) => `${request.method} ${request.url}\n${request.postData}`)
        .filter((payload) => payload.includes(args.marker)),
    ];
    const createdRecordCounts = {
      terminalControlEvents: Math.max(0, afterRecords.terminalControlEvents - beforeRecords.terminalControlEvents),
      total: Math.max(0, afterRecords.total - beforeRecords.total),
    };
    const terminalOutputEchoes = terminalText.includes(args.marker) ? 1 : 0;
    const result = {
      runId: args.runId,
      outboundWebSocketFrames: websocketFrames.length,
      outboundHttpRequests: httpRequests.length,
      rawWriteWebSocketFrames: rawWriteWebSocketFrames.length,
      rawWriteHttpRequests: rawWriteHttpRequests.length,
      markerMatchingPayloads: markerMatchingPayloads.length,
      createdRecordCounts,
      terminalOutputEchoes,
      passed:
        rawWriteWebSocketFrames.length === 0 &&
        rawWriteHttpRequests.length === 0 &&
        markerMatchingPayloads.length === 0 &&
        createdRecordCounts.total === 0 &&
        terminalOutputEchoes === 0,
    };
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.passed) {
      throw new Error(`Readonly xterm verification failed: ${stringifyPayload(result)}`);
    }
  } finally {
    captureTypingWindow = false;
    await browser.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
