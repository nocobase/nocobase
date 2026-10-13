/** Tooling regression tests on an isolated DOM; no Studio server, account or API is involved. */
import { expect, test } from '@playwright/test';
import {
  verticalScrollArea,
  wheelTo,
  workspaceGeometry,
} from './support/personal-task-geometry.ts';

test('workspace measurement executes the callback and returns width, threshold and columns in one frame', async ({
  page,
}) => {
  await page.setContent(
    '<html style="font-size:16px"><body><div id="workspace" style="width:1192px" data-columns="true"></div></body></html>',
  );
  const workspace = page.locator('#workspace');
  // Reproduce the old CI return value: string expressions do not invoke their arrow with the locator's element.
  expect(
    await workspace.evaluate(
      'element => element.getBoundingClientRect().width',
    ),
  ).toBeUndefined();
  await expect(workspaceGeometry(workspace)).resolves.toEqual({
    width: 1192,
    rem: 16,
    threshold: 1104,
    columns: true,
    consistent: true,
  });
  await page.setContent(
    '<html style="font-size:16px"><body><div id="workspace" style="width:900px"></div></body></html>',
  );
  await expect(workspaceGeometry(workspace)).resolves.toEqual({
    width: 900,
    rem: 16,
    threshold: 1104,
    columns: false,
    consistent: true,
  });
});

test('table scrolling reads its bounded ancestor and reaches the last row at phone width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const rows = Array.from(
    { length: 25 },
    (_, index) => `<tr style="height:40px"><td>Task ${index}</td></tr>`,
  ).join('');
  await page.setContent(
    `<section style="height:180px;overflow:auto"><table>${rows}</table></section>`,
  );
  const table = page.getByRole('table');
  const area = await verticalScrollArea(table);
  expect(area.clientHeight).toBe(180);
  expect(area.scrollHeight).toBeGreaterThan(area.clientHeight);
  await wheelTo(page, table, table.getByRole('row').last(), true);
});

test('missing vertical scrolling fails explicitly instead of replacing absent measurements', async ({
  page,
}) => {
  await page.setContent(
    '<section><table><tr><td>Task</td></tr></table></section>',
  );
  await expect(verticalScrollArea(page.getByRole('table'))).rejects.toThrow(
    'No bounded vertical scroller',
  );
});
