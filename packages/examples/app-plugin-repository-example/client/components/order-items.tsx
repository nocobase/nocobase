import { createUuid } from '@nocobase/app-client';
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { detailPath, type ExampleRecord } from '../model.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select.js';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableFooter,
} from './ui/table.js';

const NS = '@nocobase/app-plugin-repository-example';
export interface OrderItemDraft {
  readonly id: string;
  readonly productId: string;
  readonly quantity: string;
  readonly unitPriceCents: string;
}
export function OrderItemsEditor({
  items,
  products,
  disabled,
  onChange,
}: {
  readonly items: OrderItemDraft[];
  readonly products: ExampleRecord[];
  readonly disabled: boolean;
  readonly onChange: (items: OrderItemDraft[]) => void;
}): ReactElement {
  const { t } = useTranslation(NS);
  const update = (id: string, patch: Partial<OrderItemDraft>): void =>
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  return (
    <section className='space-y-3' aria-label={t('items')}>
      <div className='flex items-center justify-between'>
        <h3 className='font-medium'>{t('items')}</h3>
        <Button
          variant='outline'
          disabled={disabled}
          onClick={() =>
            onChange([
              ...items,
              {
                id: createUuid(),
                productId: '',
                quantity: '1',
                unitPriceCents: '0',
              },
            ])
          }
        >
          {t('addItem')}
        </Button>
      </div>
      <Table aria-label={t('items')}>
        <TableHeader>
          <TableRow>
            <TableHead>{t('product')}</TableHead>
            <TableHead>{t('quantity')}</TableHead>
            <TableHead>{t('unitPriceCents')}</TableHead>
            <TableHead>{t('lineTotal')}</TableHead>
            <TableHead>
              <span className='sr-only'>{t('removeItem')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow
              key={item.id}
              aria-label={t('itemRow', { number: index + 1 })}
            >
              <TableCell className='min-w-52'>
                <Select
                  required
                  name={`product-${item.id}`}
                  disabled={disabled}
                  value={item.productId || null}
                  items={products.map((product) => ({
                    value: product.id,
                    label: String(product.name),
                  }))}
                  onValueChange={(id) => {
                    const product = products.find((entry) => entry.id === id);
                    update(item.id, {
                      productId: id ?? '',
                      unitPriceCents: String(
                        Number(product?.unitPriceCents ?? 0),
                      ),
                    });
                  }}
                >
                  <SelectTrigger className='w-full' aria-label={t('product')}>
                    <SelectValue placeholder={t('select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {String(product.name)} · {String(product.sku)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  className='min-w-20'
                  aria-label={t('quantity')}
                  required
                  type='number'
                  min={1}
                  max={2147483647}
                  step={1}
                  disabled={disabled}
                  value={item.quantity}
                  onChange={(event) =>
                    update(item.id, { quantity: event.target.value })
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  className='min-w-28'
                  aria-label={t('unitPriceCents')}
                  required
                  type='number'
                  min={0}
                  max={2147483647}
                  step={1}
                  disabled={disabled}
                  value={item.unitPriceCents}
                  onChange={(event) =>
                    update(item.id, { unitPriceCents: event.target.value })
                  }
                />
              </TableCell>
              <TableCell className='tabular-nums'>
                {Number(item.quantity) * Number(item.unitPriceCents)}
              </TableCell>
              <TableCell>
                <Button
                  variant='ghost'
                  disabled={disabled}
                  onClick={() =>
                    onChange(items.filter((entry) => entry.id !== item.id))
                  }
                >
                  {t('removeItem')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!items.length && (
            <TableRow>
              <TableCell colSpan={5} className='text-muted-foreground'>
                {t('noItems')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>{t('orderTotal')}</TableCell>
            <TableCell colSpan={2} className='tabular-nums'>
              {items.reduce(
                (sum, item) =>
                  sum + Number(item.quantity) * Number(item.unitPriceCents),
                0,
              )}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </section>
  );
}
export function OrderItemsTable({
  items,
}: {
  readonly items: ExampleRecord[];
}): ReactElement {
  const { t } = useTranslation(NS);
  return (
    <Table aria-label={t('items')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('product')}</TableHead>
          <TableHead>{t('sku')}</TableHead>
          <TableHead>{t('quantity')}</TableHead>
          <TableHead>{t('unitPriceCents')}</TableHead>
          <TableHead>{t('lineTotal')}</TableHead>
          <TableHead>
            <span className='sr-only'>{t('view')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const product = item.product as ExampleRecord | undefined;
          return (
            <TableRow key={item.id}>
              <TableCell>
                {product ? (
                  <Link
                    className='font-medium text-primary hover:underline'
                    to={detailPath('products', product.id)}
                  >
                    {String(product.name)}
                  </Link>
                ) : (
                  t('none')
                )}
              </TableCell>
              <TableCell>{product ? String(product.sku) : '—'}</TableCell>
              <TableCell>{Number(item.quantity)}</TableCell>
              <TableCell>{Number(item.unitPriceCents)}</TableCell>
              <TableCell>
                {Number(item.quantity) * Number(item.unitPriceCents)}
              </TableCell>
              <TableCell>
                <Link
                  className='text-primary hover:underline'
                  to={detailPath('items', item.id)}
                >
                  {t('view')}
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
        {!items.length && (
          <TableRow>
            <TableCell colSpan={6}>{t('noItems')}</TableCell>
          </TableRow>
        )}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={4}>{t('orderTotal')}</TableCell>
          <TableCell colSpan={2}>
            {items.reduce(
              (sum, item) =>
                sum + Number(item.quantity) * Number(item.unitPriceCents),
              0,
            )}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
