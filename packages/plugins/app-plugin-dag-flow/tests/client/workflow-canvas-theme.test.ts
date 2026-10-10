import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const stylesheetUrl = new URL(
  '../../client/workflow-management/workflow-canvas.css',
  import.meta.url,
);

describe('workflow canvas theme', () => {
  it('maps React Flow surfaces and controls to application theme tokens', async () => {
    const stylesheet = await readFile(stylesheetUrl, 'utf8');

    expect(stylesheet).toContain('--xy-background-color: var(--background)');
    expect(stylesheet).toContain('--xy-minimap-background-color: var(--card)');
    expect(stylesheet).toContain(
      '--xy-minimap-mask-stroke-color: var(--border)',
    );
    expect(stylesheet).toContain(
      '--xy-controls-button-background-color: var(--card)',
    );
    expect(stylesheet).toContain(
      '--xy-controls-button-background-color-hover: var(--accent)',
    );
    expect(stylesheet).toContain(
      '--xy-controls-button-color: var(--card-foreground)',
    );
    expect(stylesheet).toContain(
      '--xy-controls-button-border-color: var(--border)',
    );
  });

  it('presents the execution node description as a subtle disclosure', async () => {
    const stylesheet = await readFile(stylesheetUrl, 'utf8');

    expect(stylesheet).not.toMatch(
      /\.workflow-node-description-disclosure\s*\{[^}]*border:/s,
    );
    expect(stylesheet).not.toMatch(
      /\.workflow-node-description-disclosure\s*\{[^}]*background:/s,
    );
    expect(stylesheet).toMatch(
      /\.workflow-node-description-disclosure summary\s*\{[^}]*font-size: var\(--text-sm\)/s,
    );
    expect(stylesheet).toMatch(
      /\.workflow-node-description-disclosure p\s*\{[^}]*font-size: var\(--text-sm\)/s,
    );
    expect(stylesheet).toMatch(
      /\.workflow-node-description-disclosure summary\s*\{[^}]*gap: calc\(var\(--spacing\) \* 1.5\)[^}]*list-style: none/s,
    );
    expect(stylesheet).toMatch(
      /\.workflow-node-description-disclosure summary::before\s*\{[^}]*width: calc\(var\(--spacing\) \* 2.5\)/s,
    );
    expect(stylesheet).toMatch(
      /\.workflow-node-description-disclosure p\s*\{[^}]*padding-left: calc\(var\(--spacing\) \* 4\)/s,
    );
  });
});
