import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  PropertyCard,
  PropertyLink,
  PropertyLongText,
  PropertyRow,
  PropertySelect,
  PropertyText,
  type PropertyCardVariant,
} from '../../registry/components/property-fields';

const OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
];

function Card({
  variant,
  disabled = false,
  onEmail = () => undefined,
  onStatus = () => undefined,
  onWebsite = () => undefined,
}: {
  readonly variant?: PropertyCardVariant;
  readonly disabled?: boolean;
  readonly onEmail?: (value: string | null) => void;
  readonly onStatus?: (value: string | null) => void;
  readonly onWebsite?: (value: string | null) => void;
}): ReactElement {
  const [email, setEmail] = useState<string | null>('ada@example.com');
  const [status, setStatus] = useState<string | null>('active');
  const [website, setWebsite] = useState<string | null>(
    'https://www.example.com/about',
  );
  return (
    <PropertyCard title='Properties' variant={variant}>
      <PropertyRow label='Status' htmlFor='status'>
        <PropertySelect
          id='status'
          aria-label='Status'
          options={OPTIONS}
          value={status}
          disabled={disabled}
          onChange={(next) => {
            setStatus(next);
            onStatus(next);
          }}
        />
      </PropertyRow>
      <PropertyRow label='Email' htmlFor='email' copyable>
        <PropertyText
          id='email'
          aria-label='Email'
          value={email}
          disabled={disabled}
          onChange={(next) => {
            setEmail(next);
            onEmail(next);
          }}
        />
      </PropertyRow>
      <PropertyRow label='Website' htmlFor='website' copyable>
        <PropertyLink
          id='website'
          label='Website'
          value={website}
          disabled={disabled}
          onChange={(next) => {
            setWebsite(next);
            onWebsite(next);
          }}
        />
      </PropertyRow>
    </PropertyCard>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('PropertyCard variant form', () => {
  it('shows every value in its control, as before', () => {
    render(<Card />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Active');
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue(
      'ada@example.com',
    );
    expect(screen.getByRole('link', { name: 'Open Website' })).toHaveAttribute(
      'href',
      'https://www.example.com/about',
    );
  });
});

describe('PropertyCard variant inline', () => {
  it('shows values as text until a double-click turns one into its control', () => {
    render(<Card variant='inline' />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    const email = screen.getByRole('button', { name: 'Email' });
    expect(email).toHaveTextContent('ada@example.com');
    fireEvent.click(email);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    fireEvent.doubleClick(email);
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveFocus();
  });

  it('saves a typed value on Enter and leaves it as it was on Escape', async () => {
    const onEmail = vi.fn();
    const user = userEvent.setup();
    render(<Card variant='inline' onEmail={onEmail} />);
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Email' }));
    await user.clear(screen.getByRole('textbox', { name: 'Email' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Email' }),
      'grace@example.com{Enter}',
    );
    expect(onEmail).toHaveBeenCalledWith('grace@example.com');
    expect(screen.getByRole('button', { name: 'Email' })).toHaveTextContent(
      'grace@example.com',
    );
    fireEvent.keyDown(screen.getByRole('button', { name: 'Email' }), {
      key: 'F2',
    });
    await user.type(
      screen.getByRole('textbox', { name: 'Email' }),
      ' typo{Escape}',
    );
    expect(onEmail).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Email' })).toHaveTextContent(
      'grace@example.com',
    );
  });

  it('opens a select on a double-click and saves the pick', async () => {
    const onStatus = vi.fn();
    const user = userEvent.setup();
    render(<Card variant='inline' onStatus={onStatus} />);
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'Planned' }));
    expect(onStatus).toHaveBeenCalledWith('planned');
  });

  it('opens a link from its chip and edits it from the pencil', async () => {
    const onWebsite = vi.fn();
    const user = userEvent.setup();
    render(<Card variant='inline' onWebsite={onWebsite} />);
    const chip = screen.getByRole('link', { name: 'Website: Open Website' });
    expect(chip).toHaveAttribute('href', 'https://www.example.com/about');
    expect(chip).toHaveAttribute('target', '_blank');
    expect(chip).toHaveTextContent('www.example.com');
    await user.click(screen.getByRole('button', { name: 'Edit Website' }));
    const input = screen.getByRole('textbox', { name: 'Website' });
    await user.clear(input);
    await user.type(input, 'example.org{Enter}');
    expect(onWebsite).toHaveBeenCalledWith('example.org');
    expect(
      screen.getByRole('link', { name: 'Website: Open Website' }),
    ).toHaveAttribute('href', 'https://example.org');
  });

  it("copies a link's whole address rather than the host it reads as", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    render(<Card variant='inline' />);
    const [, website] = screen.getAllByRole('button', { name: 'Copy' });
    await act(async () => {
      fireEvent.click(website!);
    });
    expect(writeText).toHaveBeenCalledWith('https://www.example.com/about');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('reads a long text in a pop-up on a click and edits it there on a double-click', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PropertyCard title='Properties' variant='inline'>
        <PropertyRow label='Introduction'>
          <PropertyLongText
            id='introduction'
            label='Introduction'
            value='Founded in 1998.'
            onChange={onChange}
          />
        </PropertyRow>
      </PropertyCard>,
    );
    expect(
      screen.queryByRole('button', { name: 'Edit Introduction' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Introduction' }));
    const popup = await screen.findByRole('dialog');
    expect(popup).toHaveTextContent('Introduction');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    fireEvent.doubleClick(within(popup).getByText('Founded in 1998.'));
    const editor = screen.getByRole('textbox', { name: 'Introduction' });
    await user.type(editor, ' Family owned.');
    fireEvent.keyDown(editor, { key: 'Enter', ctrlKey: true });
    expect(onChange).toHaveBeenCalledWith('Founded in 1998. Family owned.');
  });

  it('opens an empty long text straight into its editor', async () => {
    const user = userEvent.setup();
    render(
      <PropertyCard title='Properties' variant='inline'>
        <PropertyRow label='Introduction'>
          <PropertyLongText
            id='introduction'
            label='Introduction'
            value={null}
            placeholder='Add an introduction'
            onChange={() => undefined}
          />
        </PropertyRow>
      </PropertyCard>,
    );
    await user.click(screen.getByRole('button', { name: 'Introduction' }));
    expect(
      await screen.findByRole('textbox', { name: 'Introduction' }),
    ).toBeInTheDocument();
  });

  it('leaves a disabled value as plain text', () => {
    render(<Card variant='inline' disabled />);
    expect(
      screen.queryByRole('button', { name: 'Email' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit Website' }),
    ).not.toBeInTheDocument();
  });
});
