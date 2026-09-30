import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RouteChildPage } from '../../client/components/route-child-page.js';

describe('RouteChildPage', () => {
  it('covers the content area and scrolls its own content', () => {
    render(
      <RouteChildPage>
        <p>Child page content</p>
      </RouteChildPage>,
    );

    const scroller = screen.getByText('Child page content').parentElement!;
    const layer = scroller.parentElement!;

    // Positioned against the layout's main, so it covers the content area rather than the whole application.
    expect(layer).toHaveClass('absolute', 'inset-0');
    // The layer positions and the element inside it scrolls, the way the layout's content area does, so a deeper
    // layer rendered inside it still covers it whole.
    expect(layer).not.toHaveClass('overflow-y-auto');
    expect(scroller).toHaveClass('overflow-y-auto');
  });

  it('switches off the page it covers, and nothing outside it', () => {
    render(
      <div>
        <button type='button'>Sidebar</button>
        <div data-testid='content-area'>
          <button type='button'>Covered by the layer</button>
          <RouteChildPage>
            <button type='button'>Child page action</button>
          </RouteChildPage>
        </div>
      </div>,
    );

    // Covering a page does not close it, so without `inert` its controls stay in the tab order behind opaque paint.
    expect(screen.getByText('Covered by the layer')).toHaveAttribute('inert');
    // Only what the layer covers. The sidebar is outside the content area, which is why this is not a modal.
    expect(screen.getByText('Sidebar')).not.toHaveAttribute('inert');
    expect(screen.getByText('Child page action')).not.toHaveAttribute('inert');
  });

  it('gives the page beneath back when the layer closes', () => {
    const { rerender } = render(
      <div>
        <button type='button'>Covered by the layer</button>
        <RouteChildPage>
          <p>Child page content</p>
        </RouteChildPage>
      </div>,
    );

    expect(screen.getByText('Covered by the layer')).toHaveAttribute('inert');

    rerender(
      <div>
        <button type='button'>Covered by the layer</button>
      </div>,
    );

    expect(screen.getByText('Covered by the layer')).not.toHaveAttribute(
      'inert',
    );
  });

  it('leaves a deeper layer to restore what it marked', () => {
    const { rerender } = render(
      <div>
        <button type='button'>Parent page action</button>
        <RouteChildPage>
          <p>First layer</p>
        </RouteChildPage>
        <RouteChildPage>
          <p>Second layer</p>
        </RouteChildPage>
      </div>,
    );

    const first = layerOf('First layer');
    expect(screen.getByText('Parent page action')).toHaveAttribute('inert');
    // The second layer covers the first, so it switches that one off too.
    expect(first).toHaveAttribute('inert');

    rerender(
      <div>
        <button type='button'>Parent page action</button>
        <RouteChildPage>
          <p>First layer</p>
        </RouteChildPage>
      </div>,
    );

    // Closing the deeper layer restores only what it marked; the parent page stays covered by the layer still open.
    expect(layerOf('First layer')).not.toHaveAttribute('inert');
    expect(screen.getByText('Parent page action')).toHaveAttribute('inert');
  });

  it('covers the page around it when it renders inside another layer', () => {
    // A child page of a tab: the tab renders inside a record's page that is itself a covering layer, so the deeper
    // layer can only render through the tab's outlet, inside the enclosing layer's content.
    const { rerender } = render(
      <div>
        <button type='button'>List action</button>
        <RouteChildPage>
          <button type='button'>Record header action</button>
          <div>
            <button type='button'>Tab content</button>
            <RouteChildPage>
              <button type='button'>Nested page action</button>
            </RouteChildPage>
          </div>
          <button type='button'>After the tab</button>
        </RouteChildPage>
      </div>,
    );

    // Everything the nested layer lies over is switched off, not only its own siblings.
    expect(screen.getByText('Tab content')).toHaveAttribute('inert');
    expect(screen.getByText('Record header action')).toHaveAttribute('inert');
    expect(screen.getByText('After the tab')).toHaveAttribute('inert');
    // The nested layer sits inside the enclosing layer's content, so nothing around it may be inert.
    expect(
      screen.getByText('Nested page action').closest('[inert]'),
    ).toBeNull();

    rerender(
      <div>
        <button type='button'>List action</button>
        <RouteChildPage>
          <button type='button'>Record header action</button>
          <div>
            <button type='button'>Tab content</button>
          </div>
          <button type='button'>After the tab</button>
        </RouteChildPage>
      </div>,
    );

    // Closing it gives the record's page back, while the list stays covered by the layer still open.
    expect(screen.getByText('Tab content')).not.toHaveAttribute('inert');
    expect(screen.getByText('Record header action')).not.toHaveAttribute(
      'inert',
    );
    expect(screen.getByText('After the tab')).not.toHaveAttribute('inert');
    expect(screen.getByText('List action')).toHaveAttribute('inert');
  });

  it('anchors a layer inside another to that layer, not to its scrolling content', () => {
    render(
      <RouteChildPage>
        <section>
          <RouteChildPage>
            <p>Nested page content</p>
          </RouteChildPage>
        </section>
      </RouteChildPage>,
    );

    const nested = layerOf('Nested page content');
    const enclosing = nested.parentElement!.closest(
      '[data-slot="route-child-page"]',
    )!;
    const between: Element[] = [];
    for (
      let element = nested.parentElement;
      element && element !== enclosing;
      element = element.parentElement
    ) {
      between.push(element);
    }

    // The enclosing layer is the nearest positioned ancestor and does not scroll; the element that scrolls sits in
    // between, so scrolling the enclosing page leaves the nested layer covering it whole.
    expect(enclosing).toHaveClass('absolute');
    expect(
      between.some((element) => element.classList.contains('overflow-y-auto')),
    ).toBe(true);
    expect(
      between.some((element) =>
        ['absolute', 'relative', 'fixed', 'sticky'].some((position) =>
          element.classList.contains(position),
        ),
      ),
    ).toBe(false);
  });

  it('is not modal, so the rest of the application stays reachable', () => {
    render(
      <RouteChildPage>
        <p>Child page content</p>
      </RouteChildPage>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByText('Child page content').closest('[aria-modal]'),
    ).toBeNull();
  });
});

/** The layer element of the child page that renders `text`. */
function layerOf(text: string): HTMLElement {
  return screen
    .getByText(text)
    .closest<HTMLElement>('[data-slot="route-child-page"]')!;
}
