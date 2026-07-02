/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { chromium, Page } from 'playwright';

import { getString, parseAdminFlags, signIn } from './terminal-stream-smoke-script-utils';

interface ResponsivenessArgs {
  baseUrl: string;
  runId: string;
  adminEmail: string;
  adminPassword: string;
  waitForStream: boolean;
  maxUnresponsiveMs: number;
  maxPanelToggleMs: number;
  headed: boolean;
}

function parseInteger(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseArgs(argv: string[]): ResponsivenessArgs {
  const { booleanFlags, flags } = parseAdminFlags(argv);
  const baseUrl = getString(flags['base-url'] || flags['server-url']).replace(/\/$/, '');
  const runId = getString(flags['run-id']);
  const adminEmail = getString(flags['admin-email']);
  const adminPassword = getString(flags['admin-password']);
  if (!baseUrl || !runId || !adminEmail || !adminPassword) {
    throw new Error('--base-url, --run-id, --admin-email, and --admin-password are required');
  }
  return {
    baseUrl,
    runId,
    adminEmail,
    adminPassword,
    waitForStream: booleanFlags.has('wait-for-stream'),
    maxUnresponsiveMs: parseInteger(getString(flags['max-unresponsive-ms']), 2000),
    maxPanelToggleMs: parseInteger(getString(flags['max-panel-toggle-ms']), 1000),
    headed: booleanFlags.has('headed'),
  };
}

function buildRunUrl(baseUrl: string, runId: string) {
  const url = new URL('/admin/settings/agent-gateway/runs', baseUrl);
  url.searchParams.set('runId', runId);
  return url.toString();
}

async function readOffsetText(locator: Locator) {
  const text = await locator.textContent({ timeout: 1000 }).catch(() => '');
  const match = (text || '').match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

async function resetLagState(page: Page) {
  await page.evaluate(() => {
    const existing = (window as Window & { __agentGatewayLagState?: { last: number; maxDelay: number } })
      .__agentGatewayLagState;
    if (existing) {
      existing.last = performance.now();
      existing.maxDelay = 0;
      return;
    }
    const state = {
      last: performance.now(),
      maxDelay: 0,
    };
    (window as Window & { __agentGatewayLagState?: typeof state }).__agentGatewayLagState = state;
  });
}

async function getLiveOutputExpanded(page: Page) {
  return await page.evaluate(() => {
    const header = [...document.querySelectorAll<HTMLElement>('[aria-expanded]')].find(
      (element) => element.textContent?.includes('Live CLI Output'),
    );
    return header?.getAttribute('aria-expanded') || '';
  });
}

async function clickLiveOutputHeader(page: Page) {
  await page.evaluate(() => {
    const header = [...document.querySelectorAll<HTMLElement>('[aria-expanded]')].find(
      (element) => element.textContent?.includes('Live CLI Output'),
    );
    if (!header) {
      throw new Error('Live CLI Output header was not found');
    }
    header.click();
  });
}

async function waitForExpanded(page: Page, expanded: boolean, timeoutMs: number) {
  const startedAt = Date.now();
  const expected = expanded ? 'true' : 'false';
  while (Date.now() - startedAt < timeoutMs) {
    if ((await getLiveOutputExpanded(page)) === expected) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Live output panel did not become ${expanded ? 'expanded' : 'collapsed'}`);
}

async function main() {
  const args = parseArgs(process.argv);
  const token = await signIn({
    baseUrl: args.baseUrl,
    adminEmail: args.adminEmail,
    adminPassword: args.adminPassword,
  });
  const browser = await chromium.launch({ headless: !args.headed });
  const context = await browser.newContext();
  await context.addInitScript(
    ({ authToken }) => {
      window.localStorage.setItem('NOCOBASE_TOKEN', authToken);
      window.localStorage.setItem('NOCOBASE_AUTH', 'basic');
      window.localStorage.setItem('NOCOBASE_ROLE', 'root');
      window.localStorage.setItem('NOCOBASE_LOCALE', 'en-US');
      const state = {
        last: performance.now(),
        maxDelay: 0,
      };
      window.setInterval(() => {
        const now = performance.now();
        state.maxDelay = Math.max(state.maxDelay, now - state.last - 100);
        state.last = now;
        (window as Window & { __agentGatewayLagState?: typeof state }).__agentGatewayLagState = state;
      }, 100);
    },
    { authToken: token },
  );
  const page = await context.newPage();

  try {
    await page.goto(buildRunUrl(args.baseUrl, args.runId), { waitUntil: 'domcontentloaded', timeout: 60_000 });
    const xterm = page.locator('[data-testid="agent-gateway-readonly-xterm"]').first();
    await xterm.waitFor({ state: 'visible', timeout: 60_000 });
    const offsetLocator = page.locator('[data-testid="agent-gateway-xterm-stream-offset"]').first();
    let initialOffset = await readOffsetText(offsetLocator);
    if (args.waitForStream) {
      const startedAt = Date.now();
      while (Date.now() - startedAt < 60_000) {
        const nextOffset = await readOffsetText(offsetLocator);
        if (nextOffset > initialOffset) {
          initialOffset = nextOffset;
          break;
        }
        await page.waitForTimeout(250);
      }
    }

    await resetLagState(page);
    const collapseStartedAt = Date.now();
    await clickLiveOutputHeader(page);
    await waitForExpanded(page, false, args.maxPanelToggleMs);
    const panelCollapseMs = Date.now() - collapseStartedAt;

    const expandStartedAt = Date.now();
    await clickLiveOutputHeader(page);
    await waitForExpanded(page, true, args.maxPanelToggleMs);
    await xterm.waitFor({ state: 'visible', timeout: args.maxPanelToggleMs });
    const panelExpandMs = Date.now() - expandStartedAt;
    const panelToggleMs = Math.max(panelCollapseMs, panelExpandMs);

    let finalOffset = initialOffset;
    const progressStartedAt = Date.now();
    while (Date.now() - progressStartedAt < 15_000) {
      const nextOffset = await readOffsetText(offsetLocator);
      if (nextOffset > finalOffset) {
        finalOffset = nextOffset;
      }
      await page.waitForTimeout(500);
    }

    const lagState = await page.evaluate(() => {
      return (
        (window as Window & { __agentGatewayLagState?: { maxDelay: number } }).__agentGatewayLagState || {
          maxDelay: 0,
        }
      );
    });
    const output = {
      runId: args.runId,
      longestMainThreadUnresponsiveMs: Math.round(lagState.maxDelay),
      panelToggleMs,
      panelCollapseMs,
      panelExpandMs,
      initialOffset,
      finalOffset,
      offsetProgressed: finalOffset > initialOffset,
      passed:
        lagState.maxDelay <= args.maxUnresponsiveMs &&
        panelToggleMs <= args.maxPanelToggleMs &&
        finalOffset > initialOffset,
    };
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    if (!output.passed) {
      throw new Error(`Terminal stream responsiveness check failed: ${JSON.stringify(output)}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
