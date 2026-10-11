/**
 * Product form — a record editor showing most of what a form field can be:
 * text, combobox, grouped input, tags, slider, switch, radio cards, native
 * select, date, attachments and checkboxes, with a sidebar and a sticky save
 * bar.
 *
 * Skeleton: `PageHeader` → one `<form noValidate>` in a two-column grid. Main
 * column: Details, Pricing, Inventory and Media `Card`s. Sidebar: Status,
 * Organization and Danger zone `Card`s. A sticky action bar closes the form.
 *
 * Patterns, by the component or block that holds them:
 * - Central draft state and a typed updater: `draft`, `update`.
 * - Field-level validation with `FieldError` and `aria-invalid`: `errors`,
 *   `errorMessage`, `handleSubmit`.
 * - Searchable brand picker: the `Combobox` in Details.
 * - Prefix and suffix-action input: the SKU `InputGroup` and `suggestSku`.
 * - Tag editor with chips, Enter and suggestions: `addTag`, `removeTag`,
 *   `handleTagKeyDown`.
 * - Slider with a live derived value: the discount `Slider`.
 * - Horizontal switch and radio-card fields: `Field orientation='horizontal'`
 *   in Pricing.
 * - Field shown only when a switch is on: the low-stock threshold.
 * - Attachment list with remove: the `AttachmentGroup` in Media.
 * - Date field in a form: `DatePicker` in Status.
 * - Danger zone behind an `AlertDialog`; save bar with `Kbd` hint and
 *   `Spinner`.
 *
 * Demonstration filler to leave behind: the Fill-sample button and
 * `SAMPLE_PRODUCT`, the `UPLOAD_QUEUE` drip-feed in `uploadNext`, the
 * `setTimeout` fake save, the unbound ⌘S hint and `TAG_SUGGESTIONS`.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { format } from 'date-fns';
import {
  FileTextIcon,
  ImageIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
  WandSparklesIcon,
  XIcon,
} from 'lucide-react';
import {
  type FormEvent,
  type KeyboardEvent,
  type ReactElement,
  useMemo,
  useState,
} from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/date-picker';
import { Toaster, toast } from '@/components/ui/toast';

import { ExamplePage } from '../../shared';
import {
  BRANDS,
  EMPTY_PRODUCT,
  INITIAL_FILES,
  PRICING_MODELS,
  PRODUCT_CATEGORIES,
  PRODUCT_COLLECTIONS,
  PRODUCT_STATUSES,
  SAMPLE_PRODUCT,
  TAG_SUGGESTIONS,
  UPLOAD_QUEUE,
  WAREHOUSES,
  discountedPrice,
  formatFileSize,
  suggestSku,
  validateProduct,
  type ProductCategory,
  type ProductDraft,
  type ProductErrorField,
  type ProductErrors,
  type ProductStatus,
  type UploadedFile,
} from './product-form.data';

const STATUS_BADGE: Record<ProductStatus, 'default' | 'secondary' | 'outline'> =
  {
    draft: 'outline',
    active: 'default',
    archived: 'secondary',
  };

/** Base UI reports a single thumb as a number and several thumbs as an array. */
function firstValue(value: number | readonly number[]): number {
  return typeof value === 'number' ? value : (value[0] ?? 0);
}

export default function ProductFormExamplePage(): ReactElement {
  const { t, i18n } = useTranslation();
  const [draft, setDraft] = useState<ProductDraft>(SAMPLE_PRODUCT);
  const [errors, setErrors] = useState<ProductErrors>({});
  const [files, setFiles] = useState<readonly UploadedFile[]>(INITIAL_FILES);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const currency = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: 'USD',
      }),
    [i18n.language],
  );

  const update = <K extends keyof ProductDraft>(
    key: K,
    value: ProductDraft[K],
  ): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const errorMessage = (field: ProductErrorField): string | undefined => {
    const code = errors[field];
    return code ? t(`examples.productForm.errors.${field}.${code}`) : undefined;
  };

  const addTag = (tag: string): void => {
    const value = tag.trim();
    if (!value || draft.tags.includes(value)) {
      setTagInput('');
      return;
    }
    update('tags', [...draft.tags, value]);
    setTagInput('');
  };

  const removeTag = (tag: string): void => {
    update(
      'tags',
      draft.tags.filter((item) => item !== tag),
    );
  };

  const toggleCollection = (id: string, checked: boolean): void => {
    update(
      'collections',
      checked
        ? [...draft.collections, id]
        : draft.collections.filter((item) => item !== id),
    );
  };

  const uploadNext = (): void => {
    const next = UPLOAD_QUEUE.find(
      (candidate) => !files.some((file) => file.id === candidate.id),
    );
    if (!next) {
      toast.add({
        type: 'success',
        title: t('examples.productForm.media.queueEmpty'),
      });
      return;
    }
    setFiles((current) => [...current, next]);
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addTag(tagInput);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const next = validateProduct(draft);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.add({
        type: 'error',
        title: t('examples.productForm.toast.invalidTitle'),
        description: t('examples.productForm.toast.invalidDescription'),
      });
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      toast.add({
        type: 'success',
        title: t('examples.productForm.toast.savedTitle'),
        description: t('examples.productForm.toast.savedDescription', {
          name: draft.name,
        }),
      });
    }, 900);
  };

  const discarded = (): void => {
    setDraft(EMPTY_PRODUCT);
    setFiles([]);
    setErrors({});
    toast.add({
      type: 'success',
      title: t('examples.productForm.danger.discarded'),
    });
  };

  const price = discountedPrice(draft);
  const skuSuggestion = suggestSku(draft.name, draft.category);

  return (
    <ExamplePage
      title={t('examples.productForm.title')}
      description={t('examples.productForm.description')}
      actions={
        <>
          <Badge variant={STATUS_BADGE[draft.status]}>
            {t(`examples.productForm.status.${draft.status}`)}
          </Badge>
          <Button
            variant='outline'
            onClick={() => setDraft(SAMPLE_PRODUCT)}
            disabled={saving}
          >
            <WandSparklesIcon data-icon='inline-start' />
            {t('examples.productForm.fillSample')}
          </Button>
        </>
      }
    >
      <Toaster />

      <form noValidate onSubmit={handleSubmit} className='space-y-8'>
        <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start'>
          <div className='grid gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>{t('examples.productForm.details.title')}</CardTitle>
                <CardDescription>
                  {t('examples.productForm.details.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field data-invalid={errors.name ? true : undefined}>
                    <FieldLabel htmlFor='product-name'>
                      {t('reference.name')}
                    </FieldLabel>
                    <Input
                      id='product-name'
                      value={draft.name}
                      onChange={(event) => update('name', event.target.value)}
                      placeholder={t(
                        'examples.productForm.details.namePlaceholder',
                      )}
                      aria-invalid={errors.name ? true : undefined}
                    />
                    <FieldError>{errorMessage('name')}</FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor='product-description'>
                      {t('reference.description')}
                    </FieldLabel>
                    <Textarea
                      id='product-description'
                      rows={4}
                      value={draft.description}
                      onChange={(event) =>
                        update('description', event.target.value)
                      }
                      placeholder={t(
                        'examples.productForm.details.descriptionPlaceholder',
                      )}
                    />
                    <FieldDescription>
                      {t('examples.productForm.details.descriptionHint')}
                    </FieldDescription>
                  </Field>

                  <div className='grid gap-4 sm:grid-cols-2'>
                    <Field>
                      <FieldLabel htmlFor='product-category'>
                        {t('reference.category')}
                      </FieldLabel>
                      <Select
                        value={draft.category === '' ? null : draft.category}
                        onValueChange={(value: string | null) =>
                          update(
                            'category',
                            (value ?? '') as ProductCategory | '',
                          )
                        }
                      >
                        <SelectTrigger id='product-category' className='w-full'>
                          <SelectValue
                            placeholder={t('reference.selectPlaceholder')}
                          />
                        </SelectTrigger>
                        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                          {PRODUCT_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {t(`examples.productForm.category.${category}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor='product-brand'>
                        {t('examples.productForm.details.brand')}
                      </FieldLabel>
                      <Combobox
                        items={BRANDS}
                        value={draft.brand}
                        onValueChange={(value: string | null) =>
                          update('brand', value)
                        }
                      >
                        <ComboboxInput
                          id='product-brand'
                          placeholder={t(
                            'examples.productForm.details.brandPlaceholder',
                          )}
                          showClear
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>
                            {t('examples.productForm.details.brandEmpty')}
                          </ComboboxEmpty>
                          <ComboboxList>
                            {(brand: string) => (
                              <ComboboxItem key={brand} value={brand}>
                                {brand}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                      <FieldDescription>
                        {t('examples.productForm.details.brandHint')}
                      </FieldDescription>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor='product-sku'>
                      {t('examples.productForm.details.sku')}
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText className='font-mono'>
                          SKU
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id='product-sku'
                        className='font-mono'
                        value={draft.sku}
                        onChange={(event) => update('sku', event.target.value)}
                        placeholder={skuSuggestion}
                      />
                      <InputGroupAddon align='inline-end'>
                        <InputGroupButton
                          onClick={() => update('sku', skuSuggestion)}
                          disabled={!skuSuggestion}
                        >
                          {t('examples.productForm.details.suggest')}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldDescription>
                      {t('examples.productForm.details.skuHint')}
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor='product-tag'>
                      {t('reference.tags')}
                    </FieldLabel>
                    {draft.tags.length > 0 ? (
                      <div className='flex flex-wrap gap-1.5'>
                        {draft.tags.map((tag) => (
                          <Badge key={tag} variant='secondary'>
                            {tag}
                            <button
                              type='button'
                              onClick={() => removeTag(tag)}
                              aria-label={t(
                                'examples.productForm.details.removeTag',
                                { tag },
                              )}
                              className='text-muted-foreground hover:text-foreground'
                            >
                              <XIcon className='size-3' aria-hidden='true' />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <div className='flex gap-2'>
                      <Input
                        id='product-tag'
                        value={tagInput}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder={t(
                          'examples.productForm.details.tagPlaceholder',
                        )}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => addTag(tagInput)}
                      >
                        <PlusIcon data-icon='inline-start' />
                        {t('reference.add')}
                      </Button>
                    </div>
                    <FieldDescription>
                      {t('examples.productForm.details.tagHint')}
                    </FieldDescription>
                    <div className='flex flex-wrap gap-1.5'>
                      {TAG_SUGGESTIONS.filter(
                        (tag) => !draft.tags.includes(tag),
                      )
                        .slice(0, 5)
                        .map((tag) => (
                          <Button
                            key={tag}
                            type='button'
                            variant='ghost'
                            size='xs'
                            onClick={() => addTag(tag)}
                          >
                            <PlusIcon data-icon='inline-start' />
                            {tag}
                          </Button>
                        ))}
                    </div>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('examples.productForm.pricing.title')}</CardTitle>
                <CardDescription>
                  {t('examples.productForm.pricing.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <Field data-invalid={errors.price ? true : undefined}>
                      <FieldLabel htmlFor='product-price'>
                        {t('reference.price')}
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupAddon>
                          <InputGroupText>USD</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          id='product-price'
                          inputMode='decimal'
                          className='tabular-nums'
                          value={draft.price}
                          onChange={(event) =>
                            update('price', event.target.value)
                          }
                          aria-invalid={errors.price ? true : undefined}
                        />
                      </InputGroup>
                      <FieldError>{errorMessage('price')}</FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor='product-compare-price'>
                        {t('examples.productForm.pricing.compareAt')}
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupAddon>
                          <InputGroupText>USD</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          id='product-compare-price'
                          inputMode='decimal'
                          className='tabular-nums'
                          value={draft.compareAtPrice}
                          onChange={(event) =>
                            update('compareAtPrice', event.target.value)
                          }
                        />
                      </InputGroup>
                      <FieldDescription>
                        {t('examples.productForm.pricing.compareAtHint')}
                      </FieldDescription>
                    </Field>
                  </div>

                  <Field>
                    <div className='flex items-center justify-between gap-2'>
                      <FieldLabel htmlFor='product-discount'>
                        {t('examples.productForm.pricing.discount')}
                      </FieldLabel>
                      <span className='text-sm text-muted-foreground tabular-nums'>
                        {t('examples.productForm.pricing.percent', {
                          value: draft.discount,
                        })}
                      </span>
                    </div>
                    <Slider
                      id='product-discount'
                      value={[draft.discount]}
                      onValueChange={(value) =>
                        update('discount', firstValue(value))
                      }
                      min={0}
                      max={50}
                      step={5}
                    />
                    <FieldDescription>
                      {Number.isFinite(price)
                        ? t('examples.productForm.pricing.effective', {
                            amount: currency.format(price),
                          })
                        : t('examples.productForm.pricing.noPrice')}
                    </FieldDescription>
                  </Field>

                  <Field orientation='horizontal'>
                    <FieldContent>
                      <FieldLabel htmlFor='product-tax'>
                        {t('examples.productForm.pricing.taxInclusive')}
                      </FieldLabel>
                      <FieldDescription>
                        {t('examples.productForm.pricing.taxInclusiveHint')}
                      </FieldDescription>
                    </FieldContent>
                    <Switch
                      id='product-tax'
                      checked={draft.taxInclusive}
                      onCheckedChange={(checked) =>
                        update('taxInclusive', checked)
                      }
                    />
                  </Field>

                  <Separator />

                  <Field>
                    <FieldLabel>
                      {t('examples.productForm.pricing.model')}
                    </FieldLabel>
                    <RadioGroup
                      value={draft.pricingModel}
                      onValueChange={(value) =>
                        update(
                          'pricingModel',
                          value as ProductDraft['pricingModel'],
                        )
                      }
                    >
                      {PRICING_MODELS.map((model) => (
                        <Field
                          key={model}
                          orientation='horizontal'
                          className='items-start'
                        >
                          <RadioGroupItem
                            id={`product-model-${model}`}
                            value={model}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={`product-model-${model}`}>
                              {t(`examples.productForm.pricingModel.${model}`)}
                            </FieldLabel>
                            <FieldDescription>
                              {t(
                                `examples.productForm.pricingModelHint.${model}`,
                              )}
                            </FieldDescription>
                          </FieldContent>
                        </Field>
                      ))}
                    </RadioGroup>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t('examples.productForm.inventory.title')}
                </CardTitle>
                <CardDescription>
                  {t('examples.productForm.inventory.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <Field data-invalid={errors.quantity ? true : undefined}>
                      <FieldLabel htmlFor='product-quantity'>
                        {t('reference.quantity')}
                      </FieldLabel>
                      <Input
                        id='product-quantity'
                        inputMode='numeric'
                        className='tabular-nums'
                        value={draft.quantity}
                        onChange={(event) =>
                          update('quantity', event.target.value)
                        }
                        aria-invalid={errors.quantity ? true : undefined}
                      />
                      <FieldError>{errorMessage('quantity')}</FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor='product-warehouse'>
                        {t('examples.productForm.inventory.warehouse')}
                      </FieldLabel>
                      <NativeSelect
                        id='product-warehouse'
                        className='w-full'
                        value={draft.warehouse}
                        onChange={(event) =>
                          update('warehouse', event.target.value)
                        }
                      >
                        {WAREHOUSES.map((warehouse) => (
                          <NativeSelectOption
                            key={warehouse.id}
                            value={warehouse.id}
                          >
                            {`${warehouse.name} · ${warehouse.city}`}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>

                  <Field orientation='horizontal'>
                    <Checkbox
                      id='product-track-stock'
                      checked={draft.trackStock}
                      onCheckedChange={(checked) =>
                        update('trackStock', checked)
                      }
                    />
                    <FieldContent>
                      <FieldLabel htmlFor='product-track-stock'>
                        {t('examples.productForm.inventory.trackStock')}
                      </FieldLabel>
                      <FieldDescription>
                        {t('examples.productForm.inventory.trackStockHint')}
                      </FieldDescription>
                    </FieldContent>
                  </Field>

                  {draft.trackStock ? (
                    <Field>
                      <FieldLabel htmlFor='product-threshold'>
                        {t('examples.productForm.inventory.lowStock')}
                      </FieldLabel>
                      <Input
                        id='product-threshold'
                        inputMode='numeric'
                        className='max-w-32 tabular-nums'
                        value={draft.lowStockThreshold}
                        onChange={(event) =>
                          update('lowStockThreshold', event.target.value)
                        }
                      />
                      <FieldDescription>
                        {t('examples.productForm.inventory.lowStockHint')}
                      </FieldDescription>
                    </Field>
                  ) : null}
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('examples.productForm.media.title')}</CardTitle>
                <CardDescription>
                  {t('examples.productForm.media.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-4'>
                <AspectRatio
                  ratio={16 / 9}
                  className='flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 text-center'
                >
                  <ImageIcon
                    className='size-8 text-muted-foreground'
                    aria-hidden='true'
                  />
                  <div className='space-y-1'>
                    <p className='text-sm font-medium'>
                      {t('examples.productForm.media.dropTitle')}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {t('examples.productForm.media.dropHint')}
                    </p>
                  </div>
                  <Button type='button' variant='outline' onClick={uploadNext}>
                    <UploadIcon data-icon='inline-start' />
                    {t('reference.upload')}
                  </Button>
                </AspectRatio>

                {files.length > 0 ? (
                  <AttachmentGroup>
                    {files.map((file) => (
                      <Attachment key={file.id}>
                        <AttachmentMedia>
                          {file.kind === 'image' ? (
                            <ImageIcon />
                          ) : (
                            <FileTextIcon />
                          )}
                        </AttachmentMedia>
                        <AttachmentContent>
                          <AttachmentTitle>{file.name}</AttachmentTitle>
                          <AttachmentDescription>
                            {formatFileSize(file.size)}
                          </AttachmentDescription>
                        </AttachmentContent>
                        <AttachmentActions>
                          <AttachmentAction
                            aria-label={t(
                              'examples.productForm.media.removeFile',
                              { file: file.name },
                            )}
                            onClick={() =>
                              setFiles((current) =>
                                current.filter((item) => item.id !== file.id),
                              )
                            }
                          >
                            <XIcon />
                          </AttachmentAction>
                        </AttachmentActions>
                      </Attachment>
                    ))}
                  </AttachmentGroup>
                ) : (
                  <p className='text-sm text-muted-foreground'>
                    {t('examples.productForm.media.noFiles')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className='grid gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>{t('reference.status')}</CardTitle>
                <CardDescription>
                  {t('examples.productForm.statusCard.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor='product-status'>
                      {t('reference.status')}
                    </FieldLabel>
                    <Select
                      value={draft.status}
                      onValueChange={(value: string | null) =>
                        update('status', (value ?? 'draft') as ProductStatus)
                      }
                    >
                      <SelectTrigger id='product-status' className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                        {PRODUCT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`examples.productForm.status.${status}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor='product-publish-at'>
                      {t('examples.productForm.statusCard.publishAt')}
                    </FieldLabel>
                    <DatePicker
                      id='product-publish-at'
                      className='w-full'
                      value={draft.publishAt}
                      onChange={(date) => update('publishAt', date)}
                      placeholder={t(
                        'examples.productForm.statusCard.publishPlaceholder',
                      )}
                    />
                    <FieldDescription>
                      {draft.publishAt
                        ? t('examples.productForm.statusCard.publishOn', {
                            date: format(draft.publishAt, 'PP'),
                          })
                        : t('examples.productForm.statusCard.publishNow')}
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t('examples.productForm.organization.title')}
                </CardTitle>
                <CardDescription>
                  {t('examples.productForm.organization.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup className='gap-3'>
                  {PRODUCT_COLLECTIONS.map((collection) => (
                    <Field key={collection.id} orientation='horizontal'>
                      <Checkbox
                        id={`product-collection-${collection.id}`}
                        checked={draft.collections.includes(collection.id)}
                        onCheckedChange={(checked) =>
                          toggleCollection(collection.id, checked)
                        }
                      />
                      <FieldContent>
                        <FieldLabel
                          htmlFor={`product-collection-${collection.id}`}
                        >
                          {collection.name}
                        </FieldLabel>
                        <FieldDescription>
                          {t('examples.productForm.organization.itemCount', {
                            count: collection.count,
                          })}
                        </FieldDescription>
                      </FieldContent>
                    </Field>
                  ))}
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-destructive'>
                  {t('examples.productForm.danger.title')}
                </CardTitle>
                <CardDescription>
                  {t('examples.productForm.danger.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        type='button'
                        variant='outline'
                        className='w-full text-destructive'
                      />
                    }
                  >
                    <TrashIcon data-icon='inline-start' />
                    {t('examples.productForm.danger.discard')}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('examples.productForm.danger.confirmTitle')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('examples.productForm.danger.confirmDescription')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t('reference.cancel')}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        variant='destructive'
                        onClick={discarded}
                      >
                        {t('examples.productForm.danger.discard')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* A rounded, bordered bar pinned at bottom-0 meets the edge of the
            scroll area with its corners cut off and reads as a clipped card.
            The offset lets it float, and it still comes to rest inside the
            page's own bottom padding once the form is scrolled to its end. */}
        <div className='sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-lg border bg-card/95 p-4 text-card-foreground backdrop-blur'>
          <p className='hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex'>
            {t('examples.productForm.saveHint')}
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>S</Kbd>
            </KbdGroup>
          </p>
          <div className='ml-auto flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              disabled={saving}
              onClick={() => setDraft(EMPTY_PRODUCT)}
            >
              {t('reference.cancel')}
            </Button>
            <Button type='submit' disabled={saving}>
              {saving ? <Spinner data-icon='inline-start' /> : null}
              {t('examples.productForm.save')}
            </Button>
          </div>
        </div>
      </form>
    </ExamplePage>
  );
}
