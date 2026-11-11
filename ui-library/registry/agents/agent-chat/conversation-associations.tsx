import {
  createContext,
  useContext,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  useConversationLinks,
  useRemoveConversationLink,
} from './conversation-links.js';
import type { ConversationLink } from '@nocobase/app-plugin-agents/shared/conversations';
import { resolveAppUrl } from '@nocobase/app-client';
import { LinkIcon, PanelRightIcon, UnlinkIcon } from 'lucide-react';
import { Button } from '#components/ui/button';
import { useChatTranslation } from './chat-i18n.js';

export interface AssociationSectionProps {
  readonly conversationId: string;
  readonly links: readonly ConversationLink[];
  readonly onOpen?: ((link: ConversationLink) => boolean | void) | undefined;
}
export interface ConversationAssociationSlot {
  readonly label: string;
  /** Shown before the label in the details' section heading. */
  readonly icon?: ReactNode;
  readonly hidden?: boolean;
  /** Omitted: the kind keeps the default rows under its own label. */
  readonly render?: (props: AssociationSectionProps) => ReactNode;
}
export interface ConversationAssociationOptions {
  readonly slots?: Readonly<Record<string, ConversationAssociationSlot>>;
  readonly renderSummary?:
    | ((
        props: AssociationSectionProps & { readonly onOpenDetails: () => void },
      ) => ReactNode)
    | undefined;
  readonly onOpen?: ((link: ConversationLink) => boolean | void) | undefined;
}
const AssociationContext = createContext<ConversationAssociationOptions>({});
export function ConversationAssociationsProvider({
  children,
  ...options
}: ConversationAssociationOptions & {
  readonly children: ReactNode;
}): ReactElement {
  const inherited = useContext(AssociationContext);
  return (
    <AssociationContext.Provider
      value={{
        ...inherited,
        ...options,
        slots: { ...inherited.slots, ...options.slots },
      }}
    >
      {children}
    </AssociationContext.Provider>
  );
}
export function ConversationAssociationSummary({
  conversationId,
  onOpenDetails,
}: {
  readonly conversationId: string;
  readonly onOpenDetails: () => void;
}): ReactElement | null {
  const options = useContext(AssociationContext);
  const { t } = useChatTranslation();
  const links = useConversationLinks(conversationId).data ?? [];
  if (!links.length) return null;
  if (options.renderSummary)
    return (
      <>
        {options.renderSummary({
          conversationId,
          links,
          onOpenDetails,
          onOpen: options.onOpen,
        })}
      </>
    );
  // Generic links only say where each stands in words; count them per status, in first-seen order.
  const statuses = new Map<string, number>();
  for (const link of links)
    if (link.view?.status)
      statuses.set(link.view.status, (statuses.get(link.view.status) ?? 0) + 1);
  return (
    <button
      type='button'
      title={t('chat.showDetails')}
      onClick={onOpenDetails}
      className='flex min-w-0 items-center gap-2 rounded-md px-1 py-1 text-left text-xs hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
      data-testid='conversation-association-summary'
    >
      <LinkIcon className='size-4 shrink-0' aria-hidden />
      <span className='shrink-0 font-medium'>
        {t('chat.relatedWork')} {links.length}
      </span>
      {/* One line only: a status that does not fit wraps onto the hidden second line, whole, never cut mid-word. */}
      <span className='flex h-4 min-w-0 flex-1 flex-wrap items-center gap-x-2 overflow-hidden text-muted-foreground'>
        {[...statuses].map(([status, count]) => (
          <span key={status} className='h-4 shrink-0 whitespace-nowrap'>
            {status} {count}
          </span>
        ))}
      </span>
      <PanelRightIcon
        className='size-3.5 shrink-0 text-muted-foreground'
        aria-hidden
      />
    </button>
  );
}
export function ConversationAssociations({
  conversationId,
  onOpen,
}: {
  readonly conversationId: string;
  readonly onOpen?: ((link: ConversationLink) => boolean | void) | undefined;
}): ReactElement {
  const options = useContext(AssociationContext);
  const links = useConversationLinks(conversationId).data ?? [];
  const groups = new Map<string, ConversationLink[]>();
  for (const link of links) {
    if (!link.view) continue;
    const group = groups.get(link.kind) ?? [];
    group.push(link);
    groups.set(link.kind, group);
  }
  const open = onOpen ?? options.onOpen;
  return (
    <>
      {[...groups].map(([kind, items]) => {
        const slot = options.slots?.[kind];
        if (slot?.hidden) return null;
        return (
          <section
            key={kind}
            className='flex flex-col gap-2.5 border-b px-5 py-4'
            data-association-kind={kind}
          >
            <h3 className='flex items-center gap-1.5 text-sm font-semibold'>
              {slot?.icon}
              {slot?.label ?? kind}
              <span className='font-medium text-muted-foreground tabular-nums'>
                {items.length}
              </span>
            </h3>
            {slot?.render ? (
              slot.render({ conversationId, links: items, onOpen: open })
            ) : (
              <DefaultAssociations
                conversationId={conversationId}
                links={items}
                onOpen={open}
              />
            )}
          </section>
        );
      })}
    </>
  );
}
function DefaultAssociations({
  conversationId,
  links,
  onOpen,
}: AssociationSectionProps): ReactElement {
  const remove = useRemoveConversationLink(conversationId);
  const { t } = useChatTranslation();
  return (
    <>
      <ul className='min-w-0 divide-y rounded-md border bg-card'>
        {links.map((link) => (
          <li
            key={link.id}
            className='flex min-w-0 items-center gap-2 px-2 py-1 text-xs'
          >
            <a
              href={link.view!.url ? resolveAppUrl(link.view!.url) : undefined}
              aria-label={`${link.view!.key ?? ''} ${link.view!.title}`.trim()}
              className='flex min-w-0 flex-1 flex-col gap-0.5'
              onClick={(event) => {
                if (
                  onOpen &&
                  event.button === 0 &&
                  !event.metaKey &&
                  !event.ctrlKey &&
                  !event.shiftKey &&
                  !event.altKey
                ) {
                  if (onOpen(link) !== false) event.preventDefault();
                }
              }}
            >
              {/* The title has the first line to itself; the key and the status share the second. */}
              <span className='min-w-0 truncate'>{link.view!.title}</span>
              {(link.view!.key || link.view!.status) && (
                <span className='flex min-w-0 items-center gap-2 text-muted-foreground'>
                  <span className='min-w-0 truncate font-mono'>
                    {link.view!.key}
                  </span>
                  <span className='ml-auto shrink-0'>{link.view!.status}</span>
                </span>
              )}
            </a>
            <Button
              variant='ghost'
              size='icon-xs'
              aria-label={t('chat.unlink')}
              disabled={remove.isPending}
              onClick={() => remove.mutate(link)}
            >
              <UnlinkIcon />
            </Button>
          </li>
        ))}
      </ul>
      {remove.isError && (
        <p role='alert' className='text-xs text-destructive'>
          {t('chat.unlinkFailed')}
        </p>
      )}
    </>
  );
}
