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
import { PanelRightIcon, UnlinkIcon } from 'lucide-react';
import { Button } from '#components/ui/button';
import { useChatTranslation } from './chat-i18n.js';

export interface AssociationSectionProps {
  readonly conversationId: string;
  readonly links: readonly ConversationLink[];
  readonly onOpen?: ((link: ConversationLink) => boolean | void) | undefined;
}
export interface ConversationAssociationSlot {
  readonly label: string;
  readonly hidden?: boolean;
  readonly render: (props: AssociationSectionProps) => ReactNode;
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
  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={onOpenDetails}
      className='justify-start text-xs'
    >
      <span>
        {t('chat.relatedWork')} {links.length}
      </span>
      <PanelRightIcon className='ml-auto' />
    </Button>
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
            <h3 className='text-sm font-semibold'>
              {slot?.label ?? kind}{' '}
              <span className='font-medium text-muted-foreground'>
                {items.length}
              </span>
            </h3>
            {slot ? (
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
              className='flex min-w-0 flex-1 items-center gap-2'
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
              <span className='min-w-0 flex-1 truncate'>
                {link.view!.key} {link.view!.title}
              </span>
              <span className='shrink-0 text-muted-foreground'>
                {link.view!.status}
              </span>
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
