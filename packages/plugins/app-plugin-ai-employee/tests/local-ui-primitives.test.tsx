// @vitest-environment jsdom
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { useState, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  ConfirmDialog,
  type ConfirmDialogProps,
} from '../client/components/confirm-dialog.js';
import { Button } from '../client/components/ui/button.js';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '../client/components/ui/combobox.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../client/components/ui/collapsible.js';
import { Input } from '../client/components/ui/input.js';
import { Label } from '../client/components/ui/label.js';
import {
  RadioGroup,
  RadioGroupItem,
} from '../client/components/ui/radio-group.js';
import { Switch } from '../client/components/ui/switch.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../client/components/ui/tabs.js';

function confirmationProps(): ConfirmDialogProps {
  return {
    open: true,
    title: 'Discard changes?',
    description: 'Unsaved changes will be lost.',
    cancelLabel: 'Keep editing',
    confirmLabel: 'Discard',
    onConfirm: vi.fn(),
    onOpenChange: vi.fn(),
  };
}

describe('local confirmation primitive', () => {
  it('focuses the safe Keep editing action and keeps the original callback contract', async () => {
    const props = confirmationProps();
    render(<ConfirmDialog {...props} />);
    const dialog = await screen.findByRole('dialog', {
      name: 'Discard changes?',
    });
    expect(dialog).toHaveAccessibleDescription('Unsaved changes will be lost.');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const cancel = within(dialog).getByRole('button', { name: 'Keep editing' });
    await waitFor(() => expect(cancel).toHaveFocus());
    fireEvent.click(cancel);
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it('confirms only when explicitly requested and leaves closing to its caller', async () => {
    const props = confirmationProps();
    render(<ConfirmDialog {...props} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });

  it('keeps cancellation available when confirmation is disabled', async () => {
    const props = confirmationProps();
    render(<ConfirmDialog {...props} disabled />);
    expect(
      await screen.findByRole('button', { name: 'Discard' }),
    ).toBeDisabled();
    const cancel = screen.getByRole('button', { name: 'Keep editing' });
    await waitFor(() => expect(cancel).toHaveFocus());
    fireEvent.click(cancel);
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('prevents duplicate actions and Escape dismissal while pending', async () => {
    const props = confirmationProps();
    render(<ConfirmDialog {...props} pending />);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-busy', 'true');
    const confirm = screen.getByRole('button', { name: 'Discard' });
    const cancel = screen.getByRole('button', { name: 'Keep editing' });
    expect(confirm).toBeDisabled();
    expect(cancel).toBeDisabled();
    fireEvent.click(confirm);
    fireEvent.click(cancel);
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    expect(props.onConfirm).not.toHaveBeenCalled();
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });
});

interface EmployeeOption {
  id: string;
  label: string;
}
const ada: EmployeeOption = { id: 'ada', label: 'Ada' };
const grace: EmployeeOption = { id: 'grace', label: 'Grace' };

function EmployeeChoices({
  items,
  disabled = false,
  chipDisabled = false,
  onQuery,
  onChange,
}: {
  items: EmployeeOption[];
  disabled?: boolean;
  chipDisabled?: boolean;
  onQuery: (query: string) => void;
  onChange: (items: EmployeeOption[]) => void;
}): ReactElement {
  const [selected, setSelected] = useState<EmployeeOption[]>([ada]);
  const [query, setQuery] = useState('');
  const anchor = useComboboxAnchor();
  return (
    <Combobox
      multiple
      items={items}
      value={selected}
      onValueChange={(next) => {
        setSelected(next);
        onChange(next);
      }}
      inputValue={query}
      onInputValueChange={(next) => {
        setQuery(next);
        onQuery(next);
      }}
      itemToStringLabel={(item) => item.label}
      itemToStringValue={(item) => item.id}
      isItemEqualToValue={(left, right) => left.id === right.id}
      filter={null}
      disabled={disabled}
      defaultOpen={!disabled && !chipDisabled}
    >
      <ComboboxChips ref={anchor}>
        <ComboboxValue>
          {(values: EmployeeOption[]) =>
            values.map((item) => (
              <ComboboxChip
                key={item.id}
                removeLabel={`Remove ${item.label}`}
                disabled={chipDisabled}
              >
                {item.label}
              </ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput aria-label='Employees' />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No employees</ComboboxEmpty>
        <ComboboxList>
          {(item: EmployeeOption) => (
            <ComboboxItem key={item.id} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

describe('local combobox primitive', () => {
  it('supports remote items, controlled search, object multi selection and labeled chip removal', async () => {
    const onQuery = vi.fn();
    const onChange = vi.fn();
    const view = render(
      <EmployeeChoices items={[ada]} onQuery={onQuery} onChange={onChange} />,
    );
    const input = screen.getByRole('combobox', { name: 'Employees' });
    await act(async () => {
      input.focus();
    });
    fireEvent.change(input, { target: { value: 'remote-query' } });
    expect(onQuery).toHaveBeenCalledWith('remote-query');
    view.rerender(
      <EmployeeChoices
        items={[{ ...grace }]}
        onQuery={onQuery}
        onChange={onChange}
      />,
    );
    // Server-filtered labels need not contain the query; filter=null preserves them.
    fireEvent.click(await screen.findByRole('option', { name: 'Grace' }));
    expect(onChange).toHaveBeenLastCalledWith([ada, grace]);
    expect(
      screen.getByRole('button', { name: 'Remove Ada' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Grace' }));
    expect(onChange).toHaveBeenLastCalledWith([ada]);
    expect(
      screen.queryByRole('button', { name: 'Remove Grace' }),
    ).not.toBeInTheDocument();
  });

  it.each(['root', 'chip'] as const)(
    'prevents chip removal when %s is disabled',
    async (scope) => {
      const onChange = vi.fn();
      render(
        <EmployeeChoices
          items={[ada]}
          disabled={scope === 'root'}
          chipDisabled={scope === 'chip'}
          onQuery={vi.fn()}
          onChange={onChange}
        />,
      );
      const remove = screen.getByRole('button', { name: 'Remove Ada' });
      fireEvent.click(remove);
      fireEvent.keyDown(remove, { key: 'Enter', code: 'Enter' });
      expect(onChange).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(remove).toHaveAttribute('aria-disabled', 'true'),
      );
      if (scope === 'root')
        expect(
          screen.getByRole('combobox', { name: 'Employees' }),
        ).toBeDisabled();
    },
  );

  it('selects a single value with the keyboard through the standard List children API', async () => {
    const onChange = vi.fn();
    render(
      <Combobox items={['Alpha', 'Beta']} defaultOpen onValueChange={onChange}>
        <ComboboxInput aria-label='Model' />
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>,
    );
    const input = screen.getByRole('combobox', { name: 'Model' });
    await act(async () => {
      input.focus();
    });
    await screen.findByRole('option', { name: 'Alpha' });
    fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls[0]?.[0]).toBe('Alpha');
  });
});

describe('local control primitives', () => {
  it('preserves native labels, disabled buttons and switch checked state in both sizes', () => {
    const onClick = vi.fn();
    render(
      <>
        <Label htmlFor='employee-name'>Name</Label>
        <Input id='employee-name' />
        <Button disabled onClick={onClick}>
          Save
        </Button>
        <Switch aria-label='Default switch' />
        <Switch size='sm' aria-label='Small switch' />
      </>,
    );
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Ada' },
    });
    expect(screen.getByLabelText('Name')).toHaveValue('Ada');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).not.toHaveBeenCalled();
    for (const name of ['Default switch', 'Small switch']) {
      const control = screen.getByRole('switch', { name });
      expect(control).toHaveAttribute('aria-checked', 'false');
      fireEvent.click(control);
      expect(control).toHaveAttribute('aria-checked', 'true');
    }
  });

  it('keeps radio selection and disabled options accessible', () => {
    const onChange = vi.fn();
    render(
      <RadioGroup
        aria-label='Scope'
        defaultValue='all'
        onValueChange={onChange}
      >
        <RadioGroupItem value='all' aria-label='All' />
        <RadioGroupItem value='selected' aria-label='Selected' />
        <RadioGroupItem value='locked' aria-label='Locked' disabled />
      </RadioGroup>,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Selected' }));
    expect(screen.getByRole('radio', { name: 'Selected' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Locked' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('forwards vertical orientation to Tabs and supports collapsible disclosure', async () => {
    render(
      <>
        <Tabs defaultValue='models' orientation='vertical'>
          <TabsList aria-label='Configuration'>
            <TabsTrigger value='models'>Models</TabsTrigger>
            <TabsTrigger value='tools'>Tools</TabsTrigger>
          </TabsList>
          <TabsContent value='models'>Model settings</TabsContent>
          <TabsContent value='tools'>Tool settings</TabsContent>
        </Tabs>
        <Collapsible>
          <CollapsibleTrigger render={<Button />}>Advanced</CollapsibleTrigger>
          <CollapsibleContent>Advanced settings</CollapsibleContent>
        </Collapsible>
      </>,
    );
    expect(screen.getByRole('tablist')).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Tools' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Tool settings');
    const trigger = screen.getByRole('button', { name: 'Advanced' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    await waitFor(() =>
      expect(trigger).toHaveAttribute('aria-expanded', 'true'),
    );
    expect(screen.getByText('Advanced settings')).toBeVisible();
  });
});
