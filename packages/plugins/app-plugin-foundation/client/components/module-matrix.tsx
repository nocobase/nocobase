import { Check, Plug } from 'lucide-react';
import { cn } from 'cn';
import { useState, type ReactElement } from 'react';
import type {
  FoundationBusinessModule,
  FoundationCapability,
} from '../../shared/foundation.js';
import { CAPABILITY_ICONS } from './capability-icons.js';
import { useFoundationTranslation } from './foundation-translation.js';
import { Button } from './ui/button.js';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip.js';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from './ui/table.js';

export function ModuleMatrix({
  modules,
  capabilities,
  onSelect,
  onFocusModule,
}: {
  readonly modules: readonly FoundationBusinessModule[];
  readonly capabilities: readonly FoundationCapability[];
  readonly onSelect: (key: string) => void;
  readonly onFocusModule: (id: string | null) => void;
}): ReactElement {
  const { t, text } = useFoundationTranslation();
  const [selection, setSelection] = useState<{
    module: string;
    capability: string;
  } | null>(null);
  const module = modules.find((item) => item.id === selection?.module);
  const selected = capabilities.find(
    (item) => item.key === selection?.capability,
  );
  const link = module?.links.find((item) => item.capability === selected?.key);
  const name = (capability: FoundationCapability): string =>
    capability.title
      ? text(capability.title)
      : t(`capabilities.${capability.key}.name`);
  const choose = (
    item: FoundationBusinessModule,
    capability: FoundationCapability,
  ): void => {
    setSelection({ module: item.id, capability: capability.key });
    onSelect(capability.key);
  };
  const cell = (
    item: FoundationBusinessModule,
    capability: FoundationCapability,
  ): ReactElement => {
    const connected = item.links.some(
      (edge) => edge.capability === capability.key,
    );
    return connected ? (
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={t('matrix.inspect', {
          module: text(item.title),
          capability: name(capability),
        })}
        aria-pressed={
          selection?.module === item.id &&
          selection.capability === capability.key
        }
        className='size-6! rounded-full! border-0 bg-primary/10 p-0 text-primary shadow-none hover:bg-primary/15 aria-pressed:bg-primary aria-pressed:text-primary-foreground'
        onClick={() => choose(item, capability)}
      >
        <Check className='size-3.5' aria-hidden />
      </Button>
    ) : (
      <span
        aria-label={t('matrix.unknown')}
        className='text-muted-foreground/30'
      >
        ·
      </span>
    );
  };
  return (
    <section
      aria-labelledby='foundation-matrix-title'
      className='flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground md:p-5'
    >
      <header className='flex flex-col gap-1'>
        <h2
          id='foundation-matrix-title'
          className='font-heading text-base font-semibold'
        >
          {t('matrix.title')}
        </h2>
        <p className='text-sm text-muted-foreground'>
          {t('matrix.description')}
        </p>
      </header>
      {!modules.length ? (
        <p className='text-sm text-muted-foreground'>{t('matrix.empty')}</p>
      ) : (
        <>
          <div className='hidden min-w-0 md:block'>
            <Table
              aria-label={t('matrix.title')}
              className='table-fixed'
              style={{ minWidth: 192 + capabilities.length * 36 }}
            >
              <colgroup>
                <col className='w-44 lg:w-48' />
                {capabilities.map((capability) => (
                  <col key={capability.key} />
                ))}
              </colgroup>
              <TooltipProvider>
                <TableHeader className='bg-transparent!'>
                  <TableRow className='hover:bg-transparent!'>
                    <TableHead className='h-8! px-0! text-xs font-normal! text-muted-foreground!'>
                      {t('matrix.modules')}
                    </TableHead>
                    {capabilities.map((capability) => {
                      const Icon = CAPABILITY_ICONS[capability.key] ?? Plug;
                      return (
                        <TableHead
                          key={capability.key}
                          className='h-8! px-1! text-center'
                        >
                          <Tooltip>
                            <TooltipTrigger
                              aria-label={name(capability)}
                              aria-describedby={`foundation-column-${capability.key}`}
                              className={cn(
                                'inline-flex rounded p-1 focus-visible:outline-2 focus-visible:outline-ring',
                                capability.status === 'active'
                                  ? 'text-primary'
                                  : 'text-muted-foreground/50',
                              )}
                            >
                              <Icon className='size-4' aria-hidden />
                            </TooltipTrigger>
                            <TooltipContent
                              id={`foundation-column-${capability.key}`}
                            >
                              {name(capability)}
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
              </TooltipProvider>
              <TableBody>
                {modules.map((item) => (
                  <TableRow
                    key={item.id}
                    className='h-16 hover:bg-transparent!'
                    onMouseEnter={() => onFocusModule(item.id)}
                    onMouseLeave={() => onFocusModule(null)}
                    onFocus={() => onFocusModule(item.id)}
                    onBlur={() => onFocusModule(null)}
                  >
                    <TableHead
                      scope='row'
                      className='h-auto! px-0! py-2 text-foreground! font-normal!'
                    >
                      <span
                        title={text(item.title)}
                        className='block truncate text-sm font-semibold'
                      >
                        {text(item.title)}
                      </span>
                      <span className='mt-0.5 block text-xs font-normal text-muted-foreground'>
                        {t('matrix.summary', {
                          count: item.links.length,
                          pages: item.pageCount,
                        })}
                      </span>
                    </TableHead>
                    {capabilities.map((capability) => (
                      <TableCell
                        key={capability.key}
                        className='px-1! py-2 text-center'
                      >
                        {cell(item, capability)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className='flex flex-col gap-3 md:hidden'>
            {modules.map((item) => (
              <li
                key={item.id}
                className='min-w-0 rounded-lg border border-border/70 p-3'
              >
                <h3 className='text-sm font-medium'>{text(item.title)}</h3>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {t('matrix.summary', {
                    count: item.links.length,
                    pages: item.pageCount,
                  })}
                </p>
                <div className='mt-3 flex flex-wrap gap-2'>
                  {item.links.map((edge) => {
                    const capability = capabilities.find(
                      (value) => value.key === edge.capability,
                    );
                    if (!capability) return null;
                    const Icon = CAPABILITY_ICONS[capability.key] ?? Plug;
                    return (
                      <Button
                        key={edge.capability}
                        variant='outline'
                        size='xs'
                        className='max-w-full rounded-full! border-primary/15 bg-primary/5 whitespace-normal text-primary shadow-none'
                        aria-label={t('matrix.inspect', {
                          module: text(item.title),
                          capability: name(capability),
                        })}
                        onClick={() => choose(item, capability)}
                      >
                        <Icon className='size-3' aria-hidden />
                        {name(capability)}
                      </Button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
          {module && selected && link ? (
            <div
              role='status'
              className='flex min-w-0 flex-col gap-3 rounded-lg border border-dashed bg-background/50 p-4 text-sm'
            >
              <h3 className='font-medium'>
                {text(module.title)} · {name(selected)}
              </h3>
              <p className='text-muted-foreground'>
                {link.evidence
                  .map((evidence) => t(`matrix.evidence.${evidence}`))
                  .join(' · ')}
              </p>
              {link.providers.length ? (
                <p className='break-words font-mono text-xs text-muted-foreground'>
                  {link.providers.join(' · ')}
                </p>
              ) : null}
              {link.collections?.length ? (
                <p className='break-words text-xs text-muted-foreground'>
                  {t('matrix.collections', {
                    names: link.collections.join(', '),
                  })}
                </p>
              ) : null}
              {selected.reason !== 'unrecognizedExtension' ? (
                <div className='flex flex-col gap-1 border-t pt-3'>
                  <h4 className='font-medium'>
                    {t('detail.withoutFoundation')}
                  </h4>
                  <p className='leading-relaxed'>
                    {t(`capabilities.${selected.key}.without`)}
                  </p>
                </div>
              ) : (
                <p>{t('dynamic.pendingDescription')}</p>
              )}
            </div>
          ) : null}
          <p className='pt-1 text-xs leading-relaxed text-muted-foreground/80'>
            {t('matrix.legend')}
            {modules.some((item) => !item.complete)
              ? ` ${t('matrix.partial')}`
              : ''}
          </p>
        </>
      )}
    </section>
  );
}
