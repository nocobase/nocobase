import { useState, type ReactElement } from 'react';
import { Check, ChevronDown, Ellipsis, Plus } from 'lucide-react';
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '#components/ui/dropdown-menu';

/** Match the example application's named category palette. */
const categoryColors = {
  gray: '#64748b',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  green: '#22c55e',
  teal: '#14b8a6',
  blue: '#3b82f6',
  indigo: '#6366f1',
  purple: '#a855f7',
  pink: '#ec4899',
} as const;
export type DemoCategoryColor = keyof typeof categoryColors;

export interface DemoCategory {
  id: string;
  title: string;
  color: DemoCategoryColor;
}
export interface DemoCategoriesProps {
  categories: readonly DemoCategory[];
  value: string;
  onChange: (id: string) => void;
  onSave: (
    id: string | undefined,
    title: string,
    color: DemoCategoryColor,
  ) => void;
  onDelete: (id: string) => void;
}

/** In-memory CRUD adapter; production category storage and authorization belong to the application. */
export function DemoCategories({
  categories,
  value,
  onChange,
  onSave,
  onDelete,
}: DemoCategoriesProps): ReactElement {
  const [editor, setEditor] = useState<{
    id?: string;
    title: string;
    color: DemoCategoryColor;
  }>();
  const [deleting, setDeleting] = useState<DemoCategory>();
  const title = editor?.title.trim() ?? '';
  const duplicate = categories.some(
    (item) =>
      item.id !== editor?.id &&
      item.title.toLowerCase() === title.toLowerCase(),
  );
  return (
    <>
      <nav aria-label='Workflow categories' className='flex flex-col gap-1'>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <span className='text-sm font-medium'>Categories</span>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label='Add category'
            onClick={() => setEditor({ title: '', color: 'gray' })}
          >
            <Plus />
          </Button>
        </div>
        <Button
          variant={value === 'all' ? 'secondary' : 'ghost'}
          className='w-full justify-start'
          aria-current={value === 'all' ? 'page' : undefined}
          onClick={() => onChange('all')}
        >
          All workflows
        </Button>
        {categories.map((category) => (
          <div
            key={category.id}
            className={`flex min-w-0 items-center rounded-md ${value === category.id ? 'bg-accent text-accent-foreground' : ''}`}
          >
            <Button
              variant='ghost'
              className='min-w-0 flex-1 justify-start'
              data-category-color={category.color}
              aria-current={value === category.id ? 'page' : undefined}
              onClick={() => onChange(category.id)}
            >
              <span
                aria-hidden='true'
                className='size-2 shrink-0 rounded-full'
                style={{ backgroundColor: categoryColors[category.color] }}
              />
              <span className='truncate'>{category.title}</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    className='shrink-0'
                    aria-label={`Actions for ${category.title}`}
                  />
                }
              >
                <Ellipsis />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => setEditor({ ...category })}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => setDeleting(category)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </nav>
      <Dialog
        open={Boolean(editor)}
        onOpenChange={(open) => {
          if (!open) setEditor(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editor?.id ? 'Edit category' : 'Add category'}
            </DialogTitle>
            <DialogDescription>
              Organize workflow definitions by business area.
            </DialogDescription>
          </DialogHeader>
          <form
            className='space-y-4'
            onSubmit={(event) => {
              event.preventDefault();
              if (!title || duplicate) return;
              if (!editor) return;
              onSave(editor.id, title, editor.color);
              setEditor(undefined);
            }}
          >
            <label className='flex flex-col gap-2 text-sm font-medium'>
              Category name
              <Input
                value={editor?.title ?? ''}
                onChange={(event) =>
                  setEditor((current) =>
                    current
                      ? { ...current, title: event.target.value }
                      : current,
                  )
                }
                aria-invalid={duplicate}
              />
            </label>
            <fieldset className='space-y-2'>
              <legend className='mb-2 text-sm font-medium'>Color</legend>
              <div className='flex flex-wrap gap-2'>
                {(Object.keys(categoryColors) as DemoCategoryColor[]).map(
                  (color) => (
                    <label
                      key={color}
                      title={color[0].toUpperCase() + color.slice(1)}
                      className='relative flex size-8 cursor-pointer items-center justify-center rounded-full'
                      style={{ backgroundColor: categoryColors[color] }}
                    >
                      <input
                        type='radio'
                        name='categoryColor'
                        value={color}
                        checked={editor?.color === color}
                        onChange={() =>
                          setEditor((current) =>
                            current ? { ...current, color } : current,
                          )
                        }
                        aria-label={color[0].toUpperCase() + color.slice(1)}
                        className='peer sr-only'
                      />
                      <span className='absolute inset-0 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2' />
                      {editor?.color === color && (
                        <Check
                          aria-hidden='true'
                          className='size-4 text-white'
                        />
                      )}
                    </label>
                  ),
                )}
              </div>
            </fieldset>
            {duplicate && (
              <p role='alert' className='text-sm text-destructive'>
                A category with this name already exists.
              </p>
            )}
            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setEditor(undefined)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={!title || duplicate}>
                Save category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category</DialogTitle>
            <DialogDescription>
              Delete “{deleting?.title}”? Its workflows will remain available
              under All workflows.
            </DialogDescription>
          </DialogHeader>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setDeleting(undefined)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => {
                if (deleting) onDelete(deleting.id);
                setDeleting(undefined);
              }}
            >
              Delete category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export interface DemoWorkflowCategoryProps {
  categories: readonly DemoCategory[];
  value?: string;
  onChange: (id: string | undefined) => void;
  canEdit?: boolean;
}

/** The detail header uses the same application-owned assignment state as the list filter. */
export function DemoWorkflowCategory({
  categories,
  value,
  onChange,
  canEdit = true,
}: DemoWorkflowCategoryProps): ReactElement {
  const [open, setOpen] = useState(false);
  const category = categories.find((item) => item.id === value);
  const title = category?.title ?? 'Uncategorized';
  const tagClass =
    'inline-flex h-6 max-w-48 items-center rounded-md bg-muted px-2 text-xs font-normal tracking-normal text-foreground';
  const style = category
    ? {
        backgroundColor: `color-mix(in srgb, ${categoryColors[category.color]} 18%, transparent)`,
      }
    : undefined;
  if (!canEdit)
    return (
      <span className={tagClass} style={style} title={title}>
        <span className='truncate'>{title}</span>
      </span>
    );
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='sm'
            className={tagClass}
            style={style}
            aria-label={`Change category: ${title}`}
          />
        }
      >
        <span className='truncate'>{title}</span>
        <ChevronDown className='size-3' />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup
          value={category?.id ?? 'uncategorized'}
          onValueChange={(id) => {
            onChange(id === 'uncategorized' ? undefined : String(id));
            setOpen(false);
          }}
        >
          <DropdownMenuRadioItem value='uncategorized'>
            Uncategorized
          </DropdownMenuRadioItem>
          {categories.map((item) => (
            <DropdownMenuRadioItem key={item.id} value={item.id}>
              <span
                aria-hidden='true'
                className='size-2 shrink-0 rounded-full'
                style={{ backgroundColor: categoryColors[item.color] }}
              />
              {item.title}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
