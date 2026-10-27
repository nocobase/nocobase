import { FeedbackForm } from '#components/feedback-form';
import { useState } from 'react';
import { Check, Plus, ChevronDown, Ellipsis } from 'lucide-react';
import { cn } from 'cn';
import { useApiClient } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '#components/ui/dropdown-menu';

import {
  workflowCategoryColors,
  type WorkflowCategoryColor,
} from '../../../shared/workflow-category-colors.js';

export interface Category {
  id: string;
  title: string;
  sortOrder: number;
  color?: WorkflowCategoryColor;
}

export function CategoryManager({
  categories,
  onSaved,
  value = 'all',
  onChange,
}: {
  categories: readonly Category[];
  onSaved: (deletedId?: string) => void;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const { t } = useTranslation();
  const api = useApiClient();
  const permission = useCan({
    resource: { type: 'settings', id: 'workflow-management' },
    action: 'update',
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category>();
  const [title, setTitle] = useState('');
  const [color, setColor] = useState<WorkflowCategoryColor>('gray');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState<Category>();
  const [dragging, setDragging] = useState<string>();
  const [target, setTarget] = useState<string>();
  const dirty =
    title !== (editing?.title ?? '') || color !== (editing?.color ?? 'gray');
  const discard = () => !dirty || window.confirm(t('workflows.discardChanges'));
  const startEdit = (category?: Category) => {
    setEditing(category);
    setTitle(category?.title ?? '');
    setColor(category?.color ?? 'gray');
    setError(false);
    setOpen(true);
  };
  async function save() {
    setBusy(true);
    setError(false);
    try {
      await api.request({
        path: `workflows/categories${editing ? `/${encodeURIComponent(editing.id)}` : ''}`,
        method: editing ? 'PATCH' : 'POST',
        json: {
          title: title.trim(),
          color,
          sortOrder:
            editing?.sortOrder ??
            Math.max(-1, ...categories.map((item) => item.sortOrder)) + 1,
        },
      });
      setOpen(false);
      setTitle('');
      setEditing(undefined);
      onSaved();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError(false);
    try {
      await api.request({
        path: `workflows/categories/${encodeURIComponent(deleting.id)}`,
        method: 'DELETE',
      });
      setDeleting(undefined);
      onSaved(deleting.id);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function reorder(from: string, to: string) {
    setDragging(undefined);
    setTarget(undefined);
    if (busy || !permission.can || from === to) return;
    const ids = categories.map((item) => item.id);
    const source = ids.indexOf(from);
    const destination = ids.indexOf(to);
    if (source < 0 || destination < 0) return;
    ids.splice(source, 1);
    ids.splice(destination, 0, from);
    setBusy(true);
    setError(false);
    try {
      await api.request({
        path: 'workflows/categoryOrder',
        method: 'PUT',
        json: { ids },
      });
      onSaved();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  const categoryButtonClass =
    'hover:bg-transparent hover:text-inherit dark:hover:bg-transparent aria-expanded:bg-transparent aria-expanded:text-inherit';
  const tabClass = (selected: boolean) =>
    cn(
      'group/category relative flex min-w-0 items-center rounded-md',
      selected
        ? 'bg-accent text-accent-foreground'
        : 'text-muted-foreground hover:bg-muted has-[[aria-expanded=true]]:bg-muted',
    );
  return (
    <div className='min-w-0'>
      <nav
        aria-label={t('workflows.categoryFilter')}
        className='flex flex-col gap-1'
      >
        {[{ id: 'all', title: t('workflows.allCategories') }].map((item) => (
          <div key={item.id} className={tabClass(value === item.id)}>
            <Button
              variant='ghost'
              className={cn(
                'h-8 min-w-0 w-full justify-start text-left text-xs',
                categoryButtonClass,
              )}
              aria-pressed={value === item.id}
              onClick={() => onChange?.(item.id)}
            >
              <span className='truncate' title={item.title}>
                {item.title}
              </span>
            </Button>
          </div>
        ))}
        {categories.map((category, index) => (
          <div
            key={category.id}
            data-category-id={category.id}
            role='group'
            aria-label={category.title}
            className={cn(
              tabClass(value === category.id),
              target === category.id && dragging !== category.id && 'bg-muted',
              dragging === category.id && 'opacity-50',
            )}
            onDragOver={(event) => {
              if (dragging && !busy) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setTarget(category.id);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragging) void reorder(dragging, category.id);
            }}
          >
            <Button
              variant='ghost'
              className={cn(
                'h-8 min-w-0 w-full justify-start gap-2 text-left text-xs',
                permission.can && 'pr-9',
                permission.can && 'cursor-grab active:cursor-grabbing',
                categoryButtonClass,
              )}
              draggable={permission.can && !busy}
              onDragStart={(event) => {
                setDragging(category.id);
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', category.id);
              }}
              onDragEnd={() => {
                setDragging(undefined);
                setTarget(undefined);
              }}
              aria-pressed={value === category.id}
              onClick={() => onChange?.(category.id)}
            >
              <span
                aria-hidden='true'
                className='size-2 shrink-0 rounded-full'
                style={{
                  backgroundColor:
                    workflowCategoryColors[category.color ?? 'gray'],
                }}
              />
              <span className='min-w-0 truncate' title={category.title}>
                {category.title}
              </span>
            </Button>
            {permission.can && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant='ghost'
                      size='icon-xs'
                      className={cn(
                        'absolute inset-y-0 right-1 my-auto rounded-sm focus-visible:ring-1 focus-visible:ring-inset [@media(hover:hover)]:opacity-0 group-hover/category:opacity-100 group-focus-within/category:opacity-100 aria-expanded:opacity-100',
                        categoryButtonClass,
                      )}
                      disabled={busy}
                      aria-label={t('workflows.categoryMenu', {
                        title: category.title,
                      })}
                    />
                  }
                >
                  <Ellipsis className='size-4' />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => startEdit(category)}>
                    {t('workflows.editCategory')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={index === 0}
                    onClick={() =>
                      void reorder(category.id, categories[index - 1].id)
                    }
                  >
                    {t('workflows.moveCategoryUp')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={index === categories.length - 1}
                    onClick={() =>
                      void reorder(category.id, categories[index + 1].id)
                    }
                  >
                    {t('workflows.moveCategoryDown')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setError(false);
                      setDeleting(category);
                    }}
                  >
                    {t('workflows.deleteCategory')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
        {permission.can && (
          <Button
            variant='ghost'
            className='min-w-0 w-full justify-start gap-2 text-xs'
            disabled={busy}
            aria-label={t('workflows.addCategory')}
            onClick={() => startEdit()}
          >
            <Plus />
            <span className='truncate text-left'>
              {t('workflows.addCategory')}
            </span>
          </Button>
        )}
      </nav>
      <span role='status' aria-live='polite' className='sr-only'>
        {busy ? t('workflows.savingCategories') : ''}
      </span>
      {error && !open && !deleting && (
        <p role='alert' className='mt-2 text-sm text-destructive'>
          {t('workflows.saveFailed')}
        </p>
      )}
      <Dialog
        open={open && permission.can}
        onOpenChange={(next) => {
          if (!busy && (next || discard())) setOpen(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(
                editing
                  ? 'workflows.editCategoryTitle'
                  : 'workflows.addCategory',
              )}
            </DialogTitle>
            <DialogDescription>
              {t('workflows.categoryDialogHelp')}
            </DialogDescription>
          </DialogHeader>
          <FeedbackForm
            submitting={busy}
            error={error}
            className='space-y-4'
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <label className='grid gap-2'>
              {t('workflows.categoryName')}
              <Input
                name='title'
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={100}
                disabled={busy}
              />
            </label>
            <fieldset disabled={busy} className='space-y-2'>
              <legend className='mb-2 text-sm'>
                {t('workflows.categoryColor')}
              </legend>
              <div className='flex flex-wrap gap-2'>
                {(
                  Object.keys(workflowCategoryColors) as WorkflowCategoryColor[]
                ).map((choice) => (
                  <label
                    key={choice}
                    className='relative flex size-8 cursor-pointer items-center justify-center rounded-full'
                    style={{ backgroundColor: workflowCategoryColors[choice] }}
                  >
                    <input
                      type='radio'
                      name='categoryColor'
                      value={choice}
                      checked={color === choice}
                      onChange={() => setColor(choice)}
                      aria-label={t(`workflows.categoryColors.${choice}`)}
                      className='peer sr-only'
                    />
                    <span className='absolute inset-0 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2' />
                    {color === choice && (
                      <Check aria-hidden='true' className='size-4 text-white' />
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
            {error && (
              <p role='alert' className='text-destructive'>
                {t('workflows.saveFailed')}
              </p>
            )}
            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                disabled={busy}
                onClick={() => {
                  if (discard()) setOpen(false);
                }}
              >
                {t('workflows.cancel')}
              </Button>
              <Button type='submit' disabled={busy || !title.trim()}>
                {t('workflows.save')}
              </Button>
            </div>
          </FeedbackForm>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deleting) && permission.can}
        onOpenChange={(next) => {
          if (!next && !busy) setDeleting(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('workflows.deleteCategory')}</DialogTitle>
            <DialogDescription>
              {t('workflows.deleteCategoryConfirm', { title: deleting?.title })}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role='alert' className='text-destructive'>
              {t('workflows.saveFailed')}
            </p>
          )}
          <div className='flex justify-end gap-2'>
            <Button
              variant='outline'
              disabled={busy}
              onClick={() => setDeleting(undefined)}
            >
              {t('workflows.cancel')}
            </Button>
            <Button
              variant='destructive'
              disabled={busy}
              onClick={() => void remove()}
            >
              {t('workflows.confirmDelete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function WorkflowCategoryEditor({
  workflowId,
  value,
  categories,
  onSaved,
}: {
  workflowId: string;
  value: string | null | undefined;
  categories: readonly Category[];
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const api = useApiClient();
  const permission = useCan({
    resource: { type: 'settings', id: 'workflow-management' },
    action: 'update',
  });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const category = categories.find((item) => item.id === value);
  const title = category?.title ?? t('workflows.uncategorized');
  const tagStyle = category
    ? {
        backgroundColor: `color-mix(in srgb, ${workflowCategoryColors[category.color ?? 'gray']} 18%, transparent)`,
      }
    : undefined;
  const tagClass =
    'inline-flex h-6 max-w-48 items-center rounded-md bg-muted px-2 text-xs font-normal tracking-normal text-foreground';
  async function assign(next: string) {
    setBusy(true);
    setError(false);
    try {
      await api.request({
        path: `workflows/definitions/${encodeURIComponent(workflowId)}/category`,
        method: 'PUT',
        json: { categoryId: next === 'uncategorized' ? null : next },
      });
      setOpen(false);
      onSaved();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  if (!permission.can)
    return (
      <span className={tagClass} style={tagStyle} title={title}>
        <span className='truncate'>{title}</span>
      </span>
    );
  return (
    <span className='inline-flex flex-col items-start gap-1 font-normal tracking-normal'>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='sm'
              className={tagClass}
              style={tagStyle}
              disabled={busy}
              aria-label={t('workflows.changeCategory', { title })}
            />
          }
        >
          <span className='truncate'>{title}</span>
          <ChevronDown className='size-3' />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value={value ?? 'uncategorized'}
            onValueChange={(next) => void assign(String(next))}
          >
            <DropdownMenuRadioItem value='uncategorized' disabled={busy}>
              {t('workflows.uncategorized')}
            </DropdownMenuRadioItem>
            {categories.map((item) => (
              <DropdownMenuRadioItem
                key={item.id}
                value={item.id}
                disabled={busy}
              >
                {item.title}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && (
        <span role='alert' className='text-sm text-destructive'>
          {t('workflows.saveFailed')}
        </span>
      )}
    </span>
  );
}
