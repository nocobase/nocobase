import { renderWithApp } from '@nocobase/app-testing/client';
import { act, fireEvent, screen } from '@testing-library/react';
import { Link, Outlet, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DataTableSearch } from '../../client/components/data-table/index.js';
import { useListLocation } from '../../client/hooks/use-list-location.js';

function List() {
  const { params, setParams, active } = useListLocation();
  const setSearch = (value: string) =>
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        if (value) next.set('q', value);
        else next.delete('q');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  return (
    <>
      <output data-testid='applied'>{params.get('q') ?? ''}</output>
      <output data-testid='active'>{String(active)}</output>
      <DataTableSearch
        value={params.get('q') ?? ''}
        label='Search expenses'
        onSearch={setSearch}
      />
      <Link to={{ pathname: '7', search: `?${params}` }}>Open row</Link>
      <Outlet />
    </>
  );
}

function Detail() {
  const { search } = useLocation();
  return (
    <>
      <Link to={{ pathname: 'reject', search }}>Reject</Link>
      <Link to={{ pathname: 'edit', search }}>Edit</Link>
      <Link to={{ pathname: '..', search }}>Close</Link>
      <Outlet />
    </>
  );
}

function Url() {
  const location = useLocation();
  return (
    <output data-testid='url'>
      {location.pathname}
      {location.search}
    </output>
  );
}

async function mount() {
  await renderWithApp(
    <>
      <Routes>
        <Route path='/expenses' element={<List />}>
          <Route path=':id' element={<Detail />}>
            <Route path='reject' element={<p>Reject dialog</p>} />
            <Route path='edit' element={<p>Edit dialog</p>} />
          </Route>
        </Route>
      </Routes>
      <Url />
    </>,
    { route: '/expenses?status=open' },
  );
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const url = () => screen.getByTestId('url').textContent;

it('keeps a child route opened before the search debounce ends and applies the search on return', async () => {
  await mount();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search expenses' }), {
    target: { value: 'taxi ' },
  });
  await advance(100);
  fireEvent.click(screen.getByRole('link', { name: 'Open row' }));
  await advance(100);
  expect(url()).toBe('/expenses/7?status=open');
  // The debounce ends right after Reject is clicked, before the shell has rendered the new location: the order the
  // approval regression recorded (`/reject` replaced by `/expenses/<id>?q=`).
  fireEvent.click(screen.getByRole('link', { name: 'Reject' }));
  act(() => {
    vi.advanceTimersByTime(300);
  });
  await advance(1000);
  expect(url()).toBe('/expenses/7/reject?status=open');
  expect(screen.getByText('Reject dialog')).toBeInTheDocument();
  expect(screen.getByTestId('applied')).toHaveTextContent('');

  fireEvent.click(screen.getByRole('link', { name: 'Close' }));
  await advance(0);
  expect(url()).toBe('/expenses?status=open&q=taxi');
  expect(screen.getByTestId('applied')).toHaveTextContent('taxi');
  expect(
    screen.getByRole('searchbox', { name: 'Search expenses' }),
  ).toHaveValue('taxi ');
});

it('keeps the search when focus leaves the box and the row opens before the list renders it', async () => {
  await mount();
  const box = screen.getByRole('searchbox', { name: 'Search expenses' });
  fireEvent.change(box, { target: { value: 'taxi' } });
  // Pointer down blurs the box, then the click lands on a row link still rendered with the query from before the search.
  fireEvent.blur(box);
  fireEvent.click(screen.getByRole('link', { name: 'Open row' }));
  await advance(0);
  expect(url()).toBe('/expenses/7?status=open');
  fireEvent.click(screen.getByRole('link', { name: 'Reject' }));
  await advance(1000);
  expect(url()).toBe('/expenses/7/reject?status=open');
  expect(screen.getByText('Reject dialog')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('link', { name: 'Close' }));
  await advance(0);
  expect(url()).toBe('/expenses?status=open&q=taxi');
  expect(screen.getByTestId('applied')).toHaveTextContent('taxi');
  expect(box).toHaveValue('taxi');
});

it('keeps an edit route opened before the search debounce ends', async () => {
  await mount();
  const box = screen.getByRole('searchbox', { name: 'Search expenses' });
  fireEvent.change(box, { target: { value: 'taxi' } });
  await advance(100);
  fireEvent.click(screen.getByRole('link', { name: 'Open row' }));
  await advance(100);
  fireEvent.click(screen.getByRole('link', { name: 'Edit' }));
  act(() => {
    vi.advanceTimersByTime(300);
  });
  await advance(1000);
  expect(url()).toBe('/expenses/7/edit?status=open');
  expect(screen.getByText('Edit dialog')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('link', { name: 'Close' }));
  await advance(0);
  expect(url()).toBe('/expenses?status=open&q=taxi');
  expect(screen.getByTestId('applied')).toHaveTextContent('taxi');
  expect(box).toHaveValue('taxi');
});

it('still applies a search typed on the list itself', async () => {
  await mount();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search expenses' }), {
    target: { value: 'hotel' },
  });
  await advance(299);
  expect(url()).toBe('/expenses?status=open');
  await advance(1);
  expect(url()).toBe('/expenses?status=open&q=hotel');
  fireEvent.click(screen.getByRole('link', { name: 'Open row' }));
  await advance(0);
  expect(url()).toBe('/expenses/7?status=open&q=hotel');
  fireEvent.click(screen.getByRole('link', { name: 'Close' }));
  await advance(0);
  expect(url()).toBe('/expenses?status=open&q=hotel');
});

it('applies the typed search at once when focus leaves the box', async () => {
  await mount();
  const box = screen.getByRole('searchbox', { name: 'Search expenses' });
  fireEvent.change(box, { target: { value: 'hotel' } });
  fireEvent.blur(box);
  await advance(0);
  expect(url()).toBe('/expenses?status=open&q=hotel');
  await advance(1000);
  expect(url()).toBe('/expenses?status=open&q=hotel');
});
