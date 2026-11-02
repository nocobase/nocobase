import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import {
  PermissionFilter,
  type PermissionFilterLabels,
} from '#components/permission-filter';
const labels: PermissionFilterLabels = {
  limit: 'Up to 20 conditions',
  configure: 'Conditions',
  title: 'Configure filter',
  description: 'Apply then save role',
  all: 'All conditions',
  any: 'Any condition',
  field: 'Field',
  operator: 'Operator',
  valueType: 'Value type',
  value: 'Value',
  text: 'Text',
  number: 'Number',
  boolean: 'Boolean',
  true: 'Yes',
  false: 'No',
  add: 'Add condition',
  remove: 'Remove',
  cancel: 'Cancel',
  apply: 'Apply',
  invalid: 'Complete all conditions',
  advanced: 'Advanced conditions are preserved',
  reconfigure: 'Reconfigure',
  operators: {
    $eq: 'Equals',
    $ne: 'Not equal',
    $includes: 'Contains',
    $gt: 'Greater than',
    $gte: 'At least',
    $lt: 'Less than',
    $lte: 'At most',
    $empty: 'Empty',
    $notEmpty: 'Not empty',
  },
};
const fields = [
  { value: 'department', label: 'Department' },
  { value: 'amountCents', label: 'Amount (cents)' },
];
it('validates a filter, prevents Enter submitting the role and emits a native typed filter', async () => {
  const user = userEvent.setup(),
    apply = vi.fn(),
    submit = vi.fn((event) => event.preventDefault());
  function Draft() {
    const [open, setOpen] = useState(true);
    return (
      <form onSubmit={submit}>
        <PermissionFilter
          open={open}
          onOpenChange={setOpen}
          value={undefined}
          fields={fields}
          labels={labels}
          onApply={apply}
        />
      </form>
    );
  }
  render(<Draft />);
  expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  await user.type(screen.getByRole('textbox', { name: 'Value 1' }), 'Finance');
  await user.keyboard('{Enter}');
  expect(submit).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Add condition' }));
  await user.click(screen.getByRole('combobox', { name: 'Field 2' }));
  await user.click(
    await screen.findByRole('option', { name: 'Amount (cents)' }),
  );
  await user.click(screen.getByRole('combobox', { name: 'Operator 2' }));
  await user.click(await screen.findByRole('option', { name: 'At least' }));
  await user.type(
    screen.getByRole('textbox', { name: 'Value 2' }),
    'not a number',
  );
  expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  await user.clear(screen.getByRole('textbox', { name: 'Value 2' }));
  await user.type(screen.getByRole('textbox', { name: 'Value 2' }), '500000');
  await user.click(screen.getByRole('button', { name: 'Apply' }));
  expect(apply).toHaveBeenCalledExactlyOnceWith({
    kind: 'group',
    logic: 'and',
    items: [
      {
        kind: 'condition',
        path: ['department'],
        operator: '$eq',
        value: 'Finance',
      },
      {
        kind: 'condition',
        path: ['amountCents'],
        operator: '$gte',
        value: 500000,
      },
    ],
  });
  expect(submit).not.toHaveBeenCalled();
});
it('keeps advanced existing filters until explicit reconfiguration and cancellation never applies', async () => {
  const user = userEvent.setup(),
    apply = vi.fn(),
    close = vi.fn();
  render(
    <PermissionFilter
      open
      onOpenChange={close}
      value={{
        kind: 'group',
        logic: 'or',
        items: [{ kind: 'group', logic: 'and', items: [] }],
      }}
      fields={fields}
      labels={labels}
      onApply={apply}
    />,
  );
  await waitFor(() => expect(screen.getByText(labels.advanced)).toBeVisible());
  expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(close).toHaveBeenCalledWith(false);
  expect(apply).not.toHaveBeenCalled();
});
it('restores existing values, requires nonempty conditions and preserves typed boolean values', async () => {
  const user = userEvent.setup(),
    apply = vi.fn();
  render(
    <PermissionFilter
      open
      onOpenChange={vi.fn()}
      value={{
        kind: 'condition',
        path: ['department'],
        operator: '$eq',
        value: 'Finance',
      }}
      fields={fields}
      labels={labels}
      onApply={apply}
    />,
  );
  expect(screen.getByRole('textbox', { name: 'Value 1' })).toHaveValue(
    'Finance',
  );
  await user.click(screen.getByRole('button', { name: 'Remove' }));
  expect(screen.getByRole('button', { name: 'Add condition' })).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Add condition' }));
  await user.click(screen.getByRole('combobox', { name: 'Value type 1' }));
  await user.click(await screen.findByRole('option', { name: 'Boolean' }));
  await user.click(screen.getByRole('combobox', { name: 'Value 1' }));
  await user.click(await screen.findByRole('option', { name: 'No' }));
  await user.click(screen.getByRole('button', { name: 'Apply' }));
  expect(apply.mock.calls[0]?.[0].items[0].value).toBe(false);
});
it('keeps readonly configuration disabled', () => {
  render(
    <PermissionFilter
      open={false}
      onOpenChange={vi.fn()}
      value={undefined}
      fields={fields}
      labels={labels}
      onApply={vi.fn()}
      disabled
    />,
  );
  expect(screen.getByRole('button', { name: 'Conditions' })).toBeDisabled();
});

it('keeps the condition limit explained and restores focus when removing a row at the limit', async () => {
  render(
    <PermissionFilter
      open
      onOpenChange={vi.fn()}
      value={{
        kind: 'group',
        logic: 'and',
        items: Array.from({ length: 20 }, () => ({
          kind: 'condition',
          path: ['department'],
          operator: '$eq',
          value: 'Finance',
        })),
      }}
      fields={fields}
      labels={labels}
      onApply={vi.fn()}
    />,
  );
  expect(screen.getByRole('button', { name: 'Add condition' })).toBeDisabled();
  await waitFor(() => expect(screen.getByText(labels.limit)).toBeVisible());
  await userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]!);
  expect(screen.getByRole('button', { name: 'Add condition' })).toHaveFocus();
});
