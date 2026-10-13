/** Browser callbacks must be functions: a string arrow expression evaluates to a function, not its result. */
import { expect, type Locator, type Page } from '@playwright/test';

// Structural browser types keep the tooling project independent of the DOM library.
interface BrowserElement {
  readonly parentElement: BrowserElement | null;
  readonly ownerDocument: {
    readonly body: BrowserElement;
    readonly documentElement: BrowserElement;
    readonly defaultView: {
      getComputedStyle(element: BrowserElement): {
        fontSize: string;
        overflowY: string;
      };
    } | null;
  };
  readonly scrollHeight: number;
  readonly clientHeight: number;
  getBoundingClientRect(): {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  hasAttribute(name: string): boolean;
}

export interface WorkspaceGeometry {
  readonly width: number;
  readonly rem: number;
  readonly threshold: number;
  readonly columns: boolean;
  readonly consistent: boolean;
}

export async function workspaceGeometry(
  workspace: Locator,
): Promise<WorkspaceGeometry> {
  return workspace.evaluate((element: BrowserElement) => {
    const document = element.ownerDocument;
    if (!document.defaultView)
      throw new Error('Workspace has no browser window');
    const rem = parseFloat(
      document.defaultView.getComputedStyle(document.documentElement).fontSize,
    );
    const width = element.getBoundingClientRect().width;
    const threshold = 69 * rem;
    const columns = element.hasAttribute('data-columns');
    if (!Number.isFinite(threshold) || width <= 0)
      throw new Error('Workspace geometry is unavailable');
    return {
      width,
      rem,
      threshold,
      columns,
      consistent: columns === width >= threshold,
    };
  });
}

export async function verticalScrollArea(content: Locator) {
  return content.evaluate((element: BrowserElement) => {
    const document = element.ownerDocument;
    const window = document.defaultView;
    if (!window) throw new Error('Content has no browser window');
    let scroller: BrowserElement | null = element;
    while (
      scroller &&
      scroller !== document.body &&
      scroller !== document.documentElement
    ) {
      if (
        /auto|scroll/.test(window.getComputedStyle(scroller).overflowY) &&
        scroller.clientHeight > 0 &&
        scroller.scrollHeight > scroller.clientHeight
      ) {
        const box = scroller.getBoundingClientRect();
        return {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          scrollHeight: scroller.scrollHeight,
          clientHeight: scroller.clientHeight,
        };
      }
      scroller = scroller.parentElement;
    }
    throw new Error('No bounded vertical scroller around the content');
  });
}

export async function wheelTo(
  page: Page,
  content: Locator,
  item: Locator,
  overflows: boolean,
) {
  const area = await verticalScrollArea(content);
  if (overflows) expect(area.scrollHeight).toBeGreaterThan(area.clientHeight);
  await page.mouse.move(area.x + area.width / 2, area.y + area.height / 2);
  await expect(async () => {
    await page.mouse.wheel(0, 600);
    const box = await item.boundingBox();
    expect(box, 'The last item must still be mounted').not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(area.y - 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(area.y + area.height + 1);
  }).toPass({ intervals: [100], timeout: 20_000 });
  await expect(item).toBeInViewport({ ratio: 1 });
}
