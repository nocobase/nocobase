import { useId, useRef, useState, type ReactElement } from 'react';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '#components/ui/popover';

export interface PermissionFilterCondition {
  readonly kind: 'condition';
  readonly path: readonly string[];
  readonly operator: string;
  readonly value?: string | number | boolean;
}
export interface PermissionFilterValue {
  readonly kind: 'group';
  readonly logic: 'and' | 'or';
  readonly items: readonly PermissionFilterCondition[];
}
export interface PermissionFilterLabels {
  readonly configure: string;
  readonly title: string;
  readonly description: string;
  readonly all: string;
  readonly any: string;
  readonly field: string;
  readonly operator: string;
  readonly valueType: string;
  readonly value: string;
  readonly text: string;
  readonly number: string;
  readonly boolean: string;
  readonly true: string;
  readonly false: string;
  readonly add: string;
  readonly limit: string;
  readonly remove: string;
  readonly cancel: string;
  readonly apply: string;
  readonly invalid: string;
  readonly advanced: string;
  readonly reconfigure: string;
  readonly operators: Readonly<Record<string, string>>;
}
export interface PermissionFilterProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly value: unknown;
  readonly fields: readonly { value: string; label: string }[];
  readonly labels: PermissionFilterLabels;
  readonly disabled?: boolean;
  readonly onApply: (value: PermissionFilterValue) => void;
}
interface DraftCondition {
  id: number;
  field: string;
  operator: string;
  type: string;
  value: string;
}
const operators = [
  '$eq',
  '$ne',
  '$includes',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$empty',
  '$notEmpty',
];
function unary(operator: string): boolean {
  return operator === '$empty' || operator === '$notEmpty';
}
function numeric(operator: string): boolean {
  return ['$gt', '$gte', '$lt', '$lte'].includes(operator);
}
function read(
  value: unknown,
): { logic: 'and' | 'or'; rows: DraftCondition[] } | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const root = value as { kind?: unknown; logic?: unknown; items?: unknown };
  const items =
    root.kind === 'condition'
      ? [value]
      : root.kind === 'group' &&
          (root.logic === 'and' || root.logic === 'or') &&
          Array.isArray(root.items)
        ? root.items
        : undefined;
  if (!items?.length || items.length > 20) return undefined;
  const rows: DraftCondition[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') return undefined;
    const node = item as {
      kind?: unknown;
      path?: unknown;
      operator?: unknown;
      value?: unknown;
    };
    if (
      node.kind !== 'condition' ||
      !Array.isArray(node.path) ||
      node.path.length !== 1 ||
      typeof node.path[0] !== 'string' ||
      typeof node.operator !== 'string' ||
      !operators.includes(node.operator) ||
      (!unary(node.operator) &&
        !['string', 'number', 'boolean'].includes(typeof node.value))
    )
      return undefined;
    rows.push({
      id: rows.length,
      field: node.path[0],
      operator: node.operator,
      type:
        typeof node.value === 'number'
          ? 'number'
          : typeof node.value === 'boolean'
            ? 'boolean'
            : 'text',
      value:
        typeof node.value === 'string'
          ? node.value
          : typeof node.value === 'number' || typeof node.value === 'boolean'
            ? String(node.value)
            : '',
    });
  }
  return { logic: root.logic === 'or' ? 'or' : 'and', rows };
}
function Choice({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
    >
      <SelectTrigger size='sm' className='w-full' aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
function FilterDraft({
  value,
  fields,
  labels: w,
  onApply,
  onCancel,
}: Pick<PermissionFilterProps, 'value' | 'fields' | 'labels' | 'onApply'> & {
  onCancel: () => void;
}): ReactElement {
  const [initial] = useState(() => read(value));
  const empty = (): DraftCondition => ({
    id: 0,
    field: fields[0]?.value ?? '',
    operator: '$eq',
    type: 'text',
    value: '',
  });
  const [advanced, setAdvanced] = useState(value !== undefined && !initial);
  const [logic, setLogic] = useState<'and' | 'or'>(initial?.logic ?? 'and');
  const [rows, setRows] = useState<DraftCondition[]>(
    () => initial?.rows ?? [empty()],
  );
  const [nextId, setNextId] = useState(rows.length);
  const id = useId();
  const addRef = useRef<HTMLButtonElement>(null);
  const update = (rowId: number, patch: Partial<DraftCondition>) =>
    setRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    );
  const valid =
    !advanced &&
    rows.length > 0 &&
    rows.every(
      (row) =>
        fields.some((field) => field.value === row.field) &&
        (unary(row.operator) ||
          (row.value.trim() !== '' &&
            (row.type !== 'number' || Number.isFinite(Number(row.value))) &&
            (row.type !== 'boolean' || ['true', 'false'].includes(row.value)))),
    );
  return (
    <div
      className='flex min-h-0 flex-col gap-3'
      onKeyDown={(event) => {
        if (
          event.key === 'Enter' &&
          !event.nativeEvent.isComposing &&
          event.target instanceof HTMLInputElement
        )
          event.preventDefault();
      }}
    >
      {advanced ? (
        <div className='flex flex-col gap-3'>
          <p className='text-sm text-muted-foreground'>{w.advanced}</p>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => {
              setAdvanced(false);
              setRows([empty()]);
              setNextId(1);
            }}
          >
            {w.reconfigure}
          </Button>
        </div>
      ) : (
        <>
          <Choice
            label={w.title}
            value={logic}
            items={[
              { value: 'and', label: w.all },
              { value: 'or', label: w.any },
            ]}
            onChange={(value) => setLogic(value === 'or' ? 'or' : 'and')}
          />
          <div className='flex min-h-0 flex-col gap-3 overflow-y-auto'>
            {rows.map((row, index) => (
              <fieldset
                key={row.id}
                className='flex flex-col gap-2 rounded-lg border p-3'
              >
                <legend className='sr-only'>{`${w.field} ${index + 1}`}</legend>
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                  <Choice
                    label={`${w.field} ${index + 1}`}
                    items={fields}
                    value={row.field}
                    onChange={(field) => update(row.id, { field })}
                  />
                  <Choice
                    label={`${w.operator} ${index + 1}`}
                    items={operators.map((value) => ({
                      value,
                      label: w.operators[value] ?? value,
                    }))}
                    value={row.operator}
                    onChange={(operator) =>
                      update(row.id, {
                        operator,
                        ...(numeric(operator)
                          ? { type: 'number' }
                          : operator === '$includes'
                            ? { type: 'text' }
                            : {}),
                      })
                    }
                  />
                  {!unary(row.operator) && (
                    <>
                      {['$eq', '$ne'].includes(row.operator) && (
                        <Choice
                          label={`${w.valueType} ${index + 1}`}
                          items={[
                            { value: 'text', label: w.text },
                            { value: 'number', label: w.number },
                            { value: 'boolean', label: w.boolean },
                          ]}
                          value={row.type}
                          onChange={(type) =>
                            update(row.id, { type, value: '' })
                          }
                        />
                      )}
                      {row.type === 'boolean' ? (
                        <Choice
                          label={`${w.value} ${index + 1}`}
                          items={[
                            { value: 'true', label: w.true },
                            { value: 'false', label: w.false },
                          ]}
                          value={row.value}
                          onChange={(value) => update(row.id, { value })}
                        />
                      ) : (
                        <Input
                          aria-label={`${w.value} ${index + 1}`}
                          aria-describedby={`${id}-validation`}
                          placeholder={w.value}
                          value={row.value}
                          inputMode={row.type === 'number' ? 'decimal' : 'text'}
                          onChange={(event) =>
                            update(row.id, { value: event.target.value })
                          }
                        />
                      )}
                    </>
                  )}
                </div>
                <div className='flex justify-end'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setRows((current) =>
                        current.filter((item) => item.id !== row.id),
                      );
                      queueMicrotask(() => addRef.current?.focus());
                    }}
                  >
                    {w.remove}
                  </Button>
                </div>
              </fieldset>
            ))}
          </div>
          <Button
            ref={addRef}
            type='button'
            variant='outline'
            size='sm'
            disabled={rows.length >= 20}
            onClick={() => {
              setRows((current) => [...current, { ...empty(), id: nextId }]);
              setNextId((current) => current + 1);
            }}
          >
            {w.add}
          </Button>
          {rows.length >= 20 && (
            <p className='text-xs text-muted-foreground'>{w.limit}</p>
          )}
          {!valid && (
            <p
              id={`${id}-validation`}
              className='text-sm text-muted-foreground'
            >
              {w.invalid}
            </p>
          )}
        </>
      )}
      <div className='flex shrink-0 justify-end gap-2 border-t pt-3'>
        <Button type='button' variant='outline' size='sm' onClick={onCancel}>
          {w.cancel}
        </Button>
        <Button
          type='button'
          size='sm'
          disabled={!valid}
          onClick={() =>
            onApply({
              kind: 'group',
              logic,
              items: rows.map((row) => ({
                kind: 'condition',
                path: [row.field],
                operator: row.operator,
                ...(unary(row.operator)
                  ? {}
                  : {
                      value:
                        row.type === 'number'
                          ? Number(row.value)
                          : row.type === 'boolean'
                            ? row.value === 'true'
                            : row.value,
                    }),
              })),
            })
          }
        >
          {w.apply}
        </Button>
      </div>
    </div>
  );
}
/** Native filter input; Apply edits the containing role draft, never a server directly. */
export function PermissionFilter({
  open,
  onOpenChange,
  value,
  fields,
  labels,
  disabled = false,
  onApply,
}: PermissionFilterProps): ReactElement {
  return (
    <Popover open={open && !disabled} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-6 px-2 text-xs'
            disabled={disabled}
          />
        }
      >
        {labels.configure}
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='flex max-h-[min(36rem,var(--available-height))] w-xl max-w-(--available-width) flex-col gap-3 p-4'
      >
        <PopoverTitle>{labels.title}</PopoverTitle>
        <PopoverDescription>{labels.description}</PopoverDescription>
        {open && !disabled && (
          <FilterDraft
            value={value}
            fields={fields}
            labels={labels}
            onCancel={() => onOpenChange(false)}
            onApply={(filter) => {
              onApply(filter);
              onOpenChange(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
