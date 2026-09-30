/** @vitest-environment jsdom */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIEmployeeRecord } from '../client/ai-employee-service.js';
import { RouterProvider } from 'react-router';
import {
  createEmployeeTestRouter,
  EmployeeBrowserRoutes,
} from './employee-test-router.js';

const mocks = vi.hoisted(() => ({
  api: {},
  list: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  toaster: { show: vi.fn(), close: vi.fn() },
}));
vi.mock('@nocobase/app-client', () => ({
  useApiClient: () => mocks.api,
  createApiClient: () => mocks.api,
  resolveAppUrl: (value: string) => value,
  useToaster: () => mocks.toaster,
}));
vi.mock('../client/locales/index.js', () => ({
  useT: () => (key: string) => key,
}));
vi.mock('../client/ai-employee-service.js', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../client/ai-employee-service.js')
  >()),
  listAIEmployees: mocks.list,
  getAIEmployee: mocks.get,
  updateAIEmployee: mocks.update,
  listEnabledModels: async () => [],
  listEnabledKnowledgeBases: async () => [],
  listAISkills: async () => [],
  listAITools: async () => [],
}));

const employees: AIEmployeeRecord[] = [
  {
    username: 'ellis',
    nickname: 'Ellis',
    position: 'Research analyst',
    enabled: true,
  },
  { username: 'dex', nickname: 'Dex', enabled: true },
];

const resizeObservers: ResizeObserverMock[] = [];
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(readonly callback: () => void) {
    resizeObservers.push(this);
  }
}

let geometry: {
  dividerTop: number;
  dividerHeight: number;
  padding: number;
  headerHeight: number;
};

function notifyResize() {
  act(() => {
    for (const observer of resizeObservers) {
      if (!observer.disconnect.mock.calls.length) observer.callback();
    }
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  resizeObservers.length = 0;
  geometry = {
    dividerTop: 120,
    dividerHeight: 900,
    padding: 32,
    headerHeight: 106,
  };
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      if (this.matches('header')) {
        return new DOMRect(
          0,
          geometry.dividerTop + geometry.padding,
          600,
          geometry.headerHeight,
        );
      }
      if (this.matches('.relative.self-stretch')) {
        return new DOMRect(0, geometry.dividerTop, 32, geometry.dividerHeight);
      }
      if (this.textContent === 'Loading employee details…') {
        return new DOMRect(0, geometry.dividerTop + geometry.padding, 600, 20);
      }
      return new DOMRect();
    },
  );
  mocks.list.mockResolvedValue(employees);
  mocks.get.mockImplementation(async (_api: unknown, username: string) =>
    employees.find((employee) => employee.username === username),
  );
  mocks.update.mockImplementation(async (_api, employee, draft) => ({
    ...employee,
    ...draft,
  }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function renderPage({ collapsed = true }: { collapsed?: boolean } = {}) {
  // Flush the list response, then the selected-employee effect and response.
  // These mocks resolve immediately; their React commits must not race a
  // findBy query's wall-clock deadline on a contended CI worker.
  const router = createEmployeeTestRouter();
  const view = await act(async () =>
    render(<RouterProvider router={router} />),
  );
  expect(screen.getByRole('heading', { name: 'Ellis' })).toBeVisible();
  expect(screen.getByRole('switch', { name: 'Enabled' })).toBeVisible();
  if (
    collapsed &&
    screen.queryByRole('button', { name: 'Collapse employee list' })
  ) {
    toggleList();
  }
  return view;
}

// The host layout owns the page's <main>; the employee workspace is the grid holding the list toggle's divider.
function workspace(): HTMLElement {
  const toggle = screen.getByRole('button', {
    name: /^(Expand|Collapse) employee list$/,
  });
  return toggle.parentElement!.parentElement!;
}

function employeeList() {
  return within(screen.getByRole('complementary', { name: 'AI Employees' }));
}

function toggleList() {
  fireEvent.click(
    screen.getByRole('button', { name: /^(Expand|Collapse) employee list$/ }),
  );
}

describe('AI employee list disclosure', () => {
  it('expands multiple employees by default and restores that default on remount', async () => {
    const view = await renderPage({ collapsed: false });
    expect(
      screen.getByRole('button', { name: 'Collapse employee list' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(employeeList().getByRole('button', { name: /Dex/ })).toBeVisible();
    toggleList();
    expect(
      screen.getByRole('button', { name: 'Expand employee list' }),
    ).toHaveAttribute('aria-expanded', 'false');
    view.unmount();
    await renderPage({ collapsed: false });
    expect(
      screen.getByRole('button', { name: 'Collapse employee list' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps role editors equally sized and only shows right-aligned actions for actual edits', async () => {
    mocks.get.mockResolvedValue({
      ...employees[0],
      builtIn: true,
      about: null,
      defaultPrompt: 'System instructions',
    });
    await renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'Role settings' }));
    expect(screen.getByText('System instructions')).toHaveClass(
      'flex-1',
      'min-h-0',
      'overflow-auto',
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Custom' }));
    const editor = screen.getByRole('textbox', { name: 'Role settings' });
    expect(editor).toHaveClass('flex-1', 'min-h-0', 'resize-none');
    expect(editor).toHaveValue('');
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
    fireEvent.change(editor, { target: { value: 'New instructions' } });
    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton.parentElement).toHaveClass('w-full', 'justify-end');
    expect(saveButton.parentElement).not.toHaveClass('max-w-5xl', 'px-4');
    expect(saveButton.closest('footer')).toHaveClass(
      'absolute',
      'bottom-0',
      'inset-x-0',
    );
    expect(saveButton.closest('footer')?.parentElement).toHaveClass(
      'relative',
      'pb-16',
    );
    expect(workspace()).not.toHaveClass('mb-16');
    fireEvent.change(editor, { target: { value: '' } });
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Custom' })).toBeChecked();
    fireEvent.change(editor, { target: { value: 'New instructions' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('radio', { name: 'System default' })).toBeChecked();
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
  });

  it('defaults to collapsed for one employee while keeping the toggle usable', async () => {
    mocks.list.mockResolvedValue([employees[0]]);
    await renderPage({ collapsed: false });
    const toggle = screen.getByRole('button', { name: 'Expand employee list' });
    expect(toggle).toBeVisible();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle.querySelector('svg')).toHaveClass('lucide-chevron-right');
    toggleList();
    expect(screen.getByRole('button', { name: 'Collapse employee list' })).toBe(
      toggle,
    );
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(employeeList().getByRole('button', { name: /Ellis/ })).toBeVisible();
    toggleList();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Ellis' })).toBeVisible();
    expect(screen.getByRole('switch', { name: 'Enabled' })).toBeVisible();
  });

  it('can be collapsed with an icon-only toggle aligned to the identity header on the left divider', async () => {
    await renderPage();
    const toggle = screen.getByRole('button', { name: 'Expand employee list' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('title', 'Expand employee list');
    expect(toggle.textContent).toBe('');
    expect(toggle).not.toHaveTextContent(/\d/);
    expect(toggle.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(toggle.querySelector('svg')).toHaveClass('lucide-chevron-right');
    expect(toggle).toHaveClass(
      'transition-colors',
      'active:not-aria-[haspopup]:-translate-y-1/2',
    );
    expect(toggle).not.toHaveClass(
      'transition-all',
      'active:not-aria-[haspopup]:translate-y-px',
    );
    expect(toggle).toHaveClass(
      'absolute',
      'left-1/2',
      '-translate-x-1/2',
      '-translate-y-1/2',
      'size-[44px]',
      'lg:size-[32px]',
      'lg:pointer-coarse:size-[44px]',
      'focus-visible:ring-3',
    );
    expect(toggle).not.toHaveClass('top-1/2');
    expect(toggle.style.top).toBe('var(--employee-header-midpoint, 3rem)');
    expect(
      toggle.parentElement?.style.getPropertyValue(
        '--employee-header-midpoint',
      ),
    ).toBe('85px');
    expect(toggle.closest('aside')).toBeNull();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(workspace()).toHaveClass(
      'grid',
      'grid-cols-[44px_minmax(0,1fr)]',
      'lg:grid-cols-[32px_minmax(0,1fr)]',
      'lg:pointer-coarse:grid-cols-[44px_minmax(0,1fr)]',
      'h-[clamp(52rem,85dvh,68rem)]',
      'lg:h-auto',
      'lg:flex-1',
      'min-h-0',
      'overflow-hidden',
    );
    expect(workspace()).not.toHaveClass('lg:min-h-[32rem]');
    // The Tabs root holds the strip; the scrolling content is its next sibling.
    const tabList = screen.getByRole('tablist');
    const tabStrip = tabList.closest('[data-slot=tabs]');
    expect(tabStrip).toHaveClass('shrink-0');
    const content = tabStrip?.nextElementSibling;
    expect(content).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto', 'pb-6');
    expect(content?.parentElement).toHaveClass(
      'relative',
      'h-full',
      'min-h-0',
      'pb-16',
    );
    for (const name of ['Skills', 'Tools']) {
      fireEvent.click(screen.getByRole('tab', { name }));
      expect(tabStrip?.nextElementSibling).toBe(content);
      expect(content).toHaveClass(
        'min-w-0',
        'overflow-y-auto',
        'overflow-x-hidden',
      );
    }
    expect(workspace()).not.toHaveClass(
      'lg:grid-cols-[19rem_32px_minmax(0,1fr)]',
    );
    const panelId = toggle.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    const panel = document.getElementById(panelId!);
    expect(panel?.tagName).toBe('ASIDE');
    expect(panel).toHaveAttribute('aria-label', 'AI Employees');
    expect(panel).not.toBeVisible();
    expect(
      screen.queryByRole('button', { name: /Dex/ }),
    ).not.toBeInTheDocument();
    const heading = screen.getByRole('heading', { name: 'Ellis' });
    const header = heading.closest('header')!;
    const detail = header.closest('section')!;
    const divider = toggle.parentElement!;
    expect(divider).toHaveClass('relative', 'self-stretch');
    expect(divider.parentElement).toBe(workspace());
    expect(divider.nextElementSibling).toBe(detail);
    expect(divider.firstElementChild).toHaveClass(
      'absolute',
      'inset-y-0',
      'left-1/2',
      'border-l',
    );
    expect(divider.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(detail).not.toContainElement(toggle);
    expect(detail.firstElementChild?.firstElementChild).toBe(header);
    expect(toggle.closest('header')).toBeNull();
    expect(toggle.compareDocumentPosition(heading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(header).toHaveClass('rounded-xl', 'border', 'p-5');
    expect(
      within(header).getByRole('switch', { name: 'Enabled' }),
    ).toBeVisible();
  });

  it('tracks responsive header height and detail padding, not the workspace midpoint', async () => {
    const view = await renderPage();
    const toggle = screen.getByRole('button', { name: 'Expand employee list' });
    const divider = toggle.parentElement!;
    const header = screen
      .getByRole('heading', { name: 'Ellis' })
      .closest('header')!;
    const observer = resizeObservers.find((item) =>
      item.observe.mock.calls.some(([target]) => target === header),
    )!;
    expect(observer.observe).toHaveBeenCalledWith(header, {
      box: 'border-box',
    });
    expect(observer.observe).toHaveBeenCalledWith(divider, {
      box: 'border-box',
    });
    expect(observer.observe).toHaveBeenCalledWith(header.closest('section'));

    // A taller editor or sidebar must not pull the toggle down.
    geometry.dividerHeight = 1800;
    notifyResize();
    expect(divider.style.getPropertyValue('--employee-header-midpoint')).toBe(
      '85px',
    );

    // Mobile stacking and font reflow grow the identity card, not a fixed offset.
    geometry.padding = 16;
    geometry.headerHeight = 224;
    fireEvent(window, new Event('resize'));
    expect(divider.style.getPropertyValue('--employee-header-midpoint')).toBe(
      '128px',
    );
    geometry.headerHeight = 256;
    notifyResize();
    expect(divider.style.getPropertyValue('--employee-header-midpoint')).toBe(
      '144px',
    );

    // Expanding the list above the detail on mobile changes both viewport origins.
    toggleList();
    geometry.dividerTop = 500;
    notifyResize();
    expect(divider.style.getPropertyValue('--employee-header-midpoint')).toBe(
      '144px',
    );
    toggleList();
    geometry.padding = 32;
    geometry.headerHeight = 106;
    notifyResize();
    expect(divider.style.getPropertyValue('--employee-header-midpoint')).toBe(
      '85px',
    );
    const removeListener = vi.spyOn(window, 'removeEventListener');
    view.unmount();
    expect(observer.disconnect).toHaveBeenCalledOnce();
    expect(removeListener).toHaveBeenCalledWith('resize', observer.callback);
    expect(divider.style.getPropertyValue('--employee-header-midpoint')).toBe(
      '',
    );
  });

  it('aligns to the loading text until the selected identity card is available and reconnects on selection', async () => {
    const listResponse = Promise.withResolvers<AIEmployeeRecord[]>();
    mocks.list.mockReturnValueOnce(listResponse.promise);
    let resolveEmployee!: (employee: AIEmployeeRecord) => void;
    mocks.get.mockImplementation(
      () =>
        new Promise<AIEmployeeRecord>((resolve) => {
          resolveEmployee = resolve;
        }),
    );
    const router = createEmployeeTestRouter();
    await act(async () => render(<RouterProvider router={router} />));
    expect(screen.getByText('Loading AI employees…')).toBeVisible();
    expect(mocks.get).not.toHaveBeenCalled();
    await act(async () => listResponse.resolve(employees));
    const loading = screen.getByText('Loading employee details…');
    expect(loading).toBeVisible();
    expect(mocks.get).toHaveBeenCalledExactlyOnceWith(
      mocks.api,
      'ellis',
      expect.any(AbortSignal),
    );
    expect(
      screen.queryByRole('heading', { name: 'Ellis' }),
    ).not.toBeInTheDocument();
    toggleList();
    const toggle = screen.getByRole('button', { name: 'Expand employee list' });
    const divider = toggle.parentElement!;
    const loadingObserver = resizeObservers.find((item) =>
      item.observe.mock.calls.some(([target]) => target === loading),
    )!;
    expect(divider.style.getPropertyValue('--employee-header-midpoint')).toBe(
      '42px',
    );
    await act(async () => resolveEmployee(employees[0]!));
    expect(divider.style.getPropertyValue('--employee-header-midpoint')).toBe(
      '85px',
    );
    expect(loadingObserver.disconnect).toHaveBeenCalledOnce();
    const header = screen
      .getByRole('heading', { name: 'Ellis' })
      .closest('header')!;
    const headerObserver = resizeObservers.find((item) =>
      item.observe.mock.calls.some(([target]) => target === header),
    )!;
    toggleList();
    fireEvent.click(employeeList().getByRole('button', { name: /Dex/ }));
    expect(screen.getByText('Loading employee details…')).toBeVisible();
    expect(headerObserver.disconnect).toHaveBeenCalledOnce();
    expect(divider.style.getPropertyValue('--employee-header-midpoint')).toBe(
      '42px',
    );
    geometry.headerHeight = 160;
    await act(async () => resolveEmployee(employees[1]!));
    expect(screen.getByRole('heading', { name: 'Dex' })).toBeVisible();
    expect(divider.style.getPropertyValue('--employee-header-midpoint')).toBe(
      '112px',
    );
    geometry.headerHeight = 180;
    notifyResize();
    expect(divider.style.getPropertyValue('--employee-header-midpoint')).toBe(
      '122px',
    );
  });

  it('uses a near-top fallback until the identity header can be measured', async () => {
    geometry.headerHeight = 0;
    await renderPage();
    const toggle = screen.getByRole('button', { name: 'Expand employee list' });
    const divider = toggle.parentElement!;
    expect(divider.style.getPropertyValue('--employee-header-midpoint')).toBe(
      '',
    );
    expect(toggle.style.top).toBe('var(--employee-header-midpoint, 3rem)');
    geometry.headerHeight = 106;
    notifyResize();
    expect(divider.style.getPropertyValue('--employee-header-midpoint')).toBe(
      '85px',
    );
  });

  it('still measures on mount and window resize without ResizeObserver', async () => {
    vi.stubGlobal('ResizeObserver', undefined);
    await renderPage();
    const divider = screen.getByRole('button', {
      name: 'Expand employee list',
    }).parentElement!;
    expect(divider.style.getPropertyValue('--employee-header-midpoint')).toBe(
      '85px',
    );
    geometry.padding = 24;
    geometry.headerHeight = 140;
    fireEvent(window, new Event('resize'));
    expect(divider.style.getPropertyValue('--employee-header-midpoint')).toBe(
      '94px',
    );
  });

  it('expands to the original bordered cards and collapses without reloading details', async () => {
    await renderPage();
    const toggle = screen.getByRole('button', { name: 'Expand employee list' });
    const panel = document.getElementById(
      toggle.getAttribute('aria-controls')!,
    );
    const heading = screen.getByRole('heading', { name: 'Ellis' });
    const detail = heading.closest('section');
    const divider = toggle.parentElement;
    toggle.focus();
    toggleList();
    expect(screen.getByRole('button', { name: 'Collapse employee list' })).toBe(
      toggle,
    );
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle.querySelector('svg')).toHaveClass('lucide-chevron-left');
    expect(toggle).toHaveAttribute('title', 'Collapse employee list');
    expect(toggle.textContent).toBe('');
    expect(toggle).not.toHaveTextContent(/\d/);
    expect(toggle.parentElement).toBe(divider);
    expect(toggle).toHaveFocus();
    expect(detail).not.toContainElement(toggle);
    expect(toggle.closest('aside')).toBeNull();
    expect(panel).toBeVisible();
    expect(screen.getByRole('complementary')).toBe(panel);
    expect(workspace()).toHaveClass(
      'lg:grid-cols-[19rem_32px_minmax(0,1fr)]',
      'lg:pointer-coarse:grid-cols-[19rem_44px_minmax(0,1fr)]',
    );
    expect(screen.getByRole('complementary')).toHaveClass(
      'p-4',
      'col-span-2',
      'lg:col-span-1',
    );
    expect(employeeList().getByRole('button', { name: /Dex/ })).toHaveClass(
      'rounded-xl',
      'border',
      'p-3',
    );
    expect(employeeList().getByText('Research analyst')).toBeVisible();
    toggleList();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(panel).not.toBeVisible());
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(toggle.textContent).toBe('');
    expect(toggle.parentElement).toBe(divider);
    expect(toggle).toHaveFocus();
    expect(detail).not.toContainElement(toggle);
    expect(screen.getByRole('heading', { name: 'Ellis' })).toBe(heading);
    expect(heading).toBeVisible();
    expect(mocks.list).toHaveBeenCalledTimes(1);
    expect(mocks.get).toHaveBeenCalledTimes(1);
  });

  it('selects another employee after expanding and retains selection through collapse', async () => {
    await renderPage();
    toggleList();
    expect(employeeList().getByRole('button', { name: /Ellis/ })).toHaveClass(
      'border-primary',
    );
    fireEvent.click(employeeList().getByRole('button', { name: /Dex/ }));
    await waitFor(() =>
      expect(screen.getByLabelText('Username')).toHaveValue('dex'),
    );
    expect(mocks.get).toHaveBeenLastCalledWith(
      mocks.api,
      'dex',
      expect.any(AbortSignal),
    );
    toggleList();
    expect(screen.getByRole('heading', { name: 'Dex' })).toBeVisible();
    toggleList();
    expect(employeeList().getByRole('button', { name: /Dex/ })).toHaveClass(
      'border-primary',
    );
    expect(
      employeeList().getByRole('button', { name: /Ellis/ }),
    ).not.toHaveClass('border-primary');
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });

  it('preserves the draft, selected tab, and unsaved-change confirmation while toggling', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('switch', { name: 'Enabled' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Role settings' }));
    const editor = screen.getByRole('textbox', { name: 'Role settings' });
    fireEvent.change(editor, { target: { value: 'Preserve my draft' } });
    toggleList();
    toggleList();
    expect(screen.getByRole('textbox', { name: 'Role settings' })).toBe(editor);
    expect(editor).toHaveValue('Preserve my draft');
    expect(screen.getByRole('tab', { name: 'Role settings' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('switch', { name: 'Enabled' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
    toggleList();
    fireEvent.click(employeeList().getByRole('button', { name: /Dex/ }));
    expect(
      await screen.findByRole('dialog', { name: 'Discard unsaved changes?' }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { name: 'Ellis' })).toBeVisible();
    expect(editor).toHaveValue('Preserve my draft');
    expect(mocks.get).toHaveBeenCalledTimes(1);
    fireEvent.click(employeeList().getByRole('button', { name: /Dex/ }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Discard changes' }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Username')).toHaveValue('dex'),
    );
    expect(screen.getByRole('switch', { name: 'Enabled' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('saves edits with the list collapsed and resets disclosure state on remount', async () => {
    const view = await renderPage();
    fireEvent.click(screen.getByRole('switch', { name: 'Enabled' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        mocks.api,
        employees[0],
        expect.objectContaining({ enabled: false }),
      ),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: 'Expand employee list' }),
    ).toHaveAttribute('aria-expanded', 'false');
    toggleList();
    view.unmount();
    await renderPage();
    expect(
      screen.getByRole('button', { name: 'Expand employee list' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('AI employee history navigation under the host BrowserRouter', () => {
  const profile = (username: string) =>
    `/settings/ai/employees/${username}/profile`;
  const role = (username: string) => `/settings/ai/employees/${username}/role`;

  async function traverse(delta: number): Promise<void> {
    await act(async () => {
      window.history.go(delta);
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  }

  async function renderHistory(entries: string[]) {
    window.history.replaceState(
      { usr: null, key: 'h0', idx: 0 },
      '',
      entries[0],
    );
    entries.slice(1).forEach((entry, index) => {
      window.history.pushState(
        { usr: null, key: `h${index + 1}`, idx: index + 1 },
        '',
        entry,
      );
    });
    await act(async () => render(<EmployeeBrowserRoutes />));
  }

  it('asks before back navigation to another employee and keeps the draft when editing continues', async () => {
    await renderHistory([profile('dex'), profile('ellis'), role('ellis')]);
    const editor = await screen.findByRole('textbox', {
      name: 'Role settings',
    });
    fireEvent.change(editor, { target: { value: 'Unsaved role' } });

    // Another Tab of the same employee shares the draft, so it passes unasked.
    await traverse(-1);
    await waitFor(() =>
      expect(window.location.pathname).toBe(profile('ellis')),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await traverse(-1);
    expect(
      await screen.findByRole('dialog', { name: 'Discard unsaved changes?' }),
    ).toBeVisible();
    // The browser has moved, but the edited employee stays rendered behind the modal and the target is not loaded.
    expect(
      screen.getByRole('heading', { name: 'Ellis', hidden: true }),
    ).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    await waitFor(() =>
      expect(window.location.pathname).toBe(profile('ellis')),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ellis' })).toBeVisible();
    expect(mocks.get).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('tab', { name: 'Role settings' }));
    expect(
      await screen.findByRole('textbox', { name: 'Role settings' }),
    ).toHaveValue('Unsaved role');
  });

  it('completes the traversal and loads the target employee once the discard is confirmed', async () => {
    await renderHistory([profile('dex'), profile('ellis')]);
    fireEvent.click(await screen.findByRole('switch', { name: 'Enabled' }));
    await traverse(-1);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Discard changes' }),
    );
    await waitFor(() => expect(window.location.pathname).toBe(profile('dex')));
    expect(await screen.findByRole('heading', { name: 'Dex' })).toBeVisible();
    expect(screen.getByLabelText('Username')).toHaveValue('dex');
    expect(mocks.update).not.toHaveBeenCalled();

    // Forward returns to Ellis's saved values, not the discarded draft.
    await traverse(1);
    expect(await screen.findByRole('heading', { name: 'Ellis' })).toBeVisible();
    expect(screen.getByRole('switch', { name: 'Enabled' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('leaves the settings page through history without asking once the draft is saved', async () => {
    await renderHistory(['/outside', profile('ellis')]);
    fireEvent.click(await screen.findByRole('switch', { name: 'Enabled' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument(),
    );
    await traverse(-1);
    expect(
      await screen.findByRole('heading', { name: 'Outside employee settings' }),
    ).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
