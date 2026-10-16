/**
 * A record tied to the session opened beside the conversation, in the panel its application gives its kind
 * (`linkPanels`, `LinkPanelProps`), so the person reads and acts on it while the conversation stays in view. The open
 * record is in the address (`?<kind>=<refId>`, replaced as it changes); J and K, or the panel's arrows, move among the
 * session's records of that kind, and Esc closes it. On a phone the records are a sheet from the bottom: the session's
 * list first, those waiting for the viewer at the top, then a record over almost the whole screen, with "← Tasks" back
 * to the list; closing it returns to the conversation where it was.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { ArrowLeftIcon, InfoIcon } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router';

import type { Session, SessionLink } from '../../shared/api.js';
import { useLinkPanels } from '../config.js';
import { waitingFirst } from '../lib/tones.js';
import { LinkList, Sheet } from './link-sheet.js';
import { Button } from './ui/button.js';

function usePhone(): boolean {
  const query = '(max-width: 767px)';
  const [phone, setPhone] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const change = () => setPhone(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  return phone;
}

/** Wide enough for the panel beside the conversation; narrower, it lies over the conversation. */
function useWide(): boolean {
  const query = '(min-width: 1280px)';
  const [wide, setWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const change = () => setWide(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  return wide;
}

function typing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    Boolean(
      target.closest(
        '[role=dialog],[role=alertdialog],[role=menu],[role=listbox]',
      ),
    )
  );
}

export interface LinkPanelState {
  /** Opens a record in its panel; false when its kind has none, so the caller follows its `href`. */
  readonly open: (
    link: Pick<SessionLink, 'kind' | 'refId' | 'href'>,
  ) => boolean;
  /** Opens what the session's work summary leads to: the first record waiting for the viewer, else the first one. */
  readonly openSummary: () => boolean;
  readonly close: () => void;
  /** Whether a record is open (beside the conversation, or in the phone's sheet). */
  readonly opened: boolean;
  /** The panel or the phone's sheets, to render beside the conversation. */
  readonly element: ReactNode;
}

export function useLinkPanel(
  session: Session | undefined,
  onShowDetails: () => void,
): LinkPanelState {
  const { t } = useTranslation();
  const linkPanels = useLinkPanels();
  const [params, setParams] = useSearchParams();
  const phone = usePhone();
  const wide = useWide();
  const [listOpen, setListOpen] = useState(false);
  const kinds = Object.keys(linkPanels);
  const kind = kinds.find((name) => params.has(name)) ?? null;
  const refId = kind ? params.get(kind) : null;
  const links = useMemo(() => session?.links ?? [], [session?.links]);

  const open = useCallback(
    (link: Pick<SessionLink, 'kind' | 'refId' | 'href'>): boolean => {
      if (!linkPanels[link.kind]) return false;
      const next = new URLSearchParams(params);
      for (const name of kinds) next.delete(name);
      next.set(link.kind, link.refId);
      setParams(next, { replace: true });
      setListOpen(false);
      return true;
    },
    [linkPanels, params, kinds, setParams],
  );
  const close = useCallback(() => {
    const next = new URLSearchParams(params);
    for (const name of kinds) next.delete(name);
    setParams(next, { replace: true });
  }, [params, kinds, setParams]);
  const openSummary = useCallback((): boolean => {
    if (phone && links.some((link) => linkPanels[link.kind])) {
      setListOpen(true);
      return true;
    }
    const first = waitingFirst(links).find((link) => linkPanels[link.kind]);
    return first ? open(first) : false;
  }, [phone, links, linkPanels, open]);

  const siblings = useMemo(
    () => (kind ? links.filter((link) => link.kind === kind) : []),
    [kind, links],
  );
  const index = siblings.findIndex((link) => link.refId === refId);
  // A record mentioned but not tied to the session opens too, alone.
  const current: SessionLink | null = useMemo(
    () =>
      kind && refId
        ? (siblings[index] ?? {
            kind,
            refId,
            key: null,
            title: '',
            group: null,
            status: null,
            href: null,
            startable: false,
            decidedAt: null,
          })
        : null,
    [kind, refId, siblings, index],
  );
  const step = useCallback(
    (delta: 1 | -1) => {
      const next = siblings[index + delta];
      if (next) open(next);
    },
    [siblings, index, open],
  );

  useEffect(() => {
    if (!current || phone) return;
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      if (event.key === 'Escape' && !typing(event.target)) {
        close();
        return;
      }
      if (typing(event.target)) return;
      if (event.key === 'j') step(1);
      else if (event.key === 'k') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, phone, close, step]);

  const Panel = kind ? linkPanels[kind] : undefined;
  const panel =
    current && Panel ? (
      <Panel
        key={`${current.kind}:${current.refId}`}
        link={current}
        index={index + 1}
        total={siblings.length}
        onPrevious={index > 0 ? () => step(-1) : undefined}
        onNext={
          index >= 0 && index < siblings.length - 1 ? () => step(1) : undefined
        }
        onClose={close}
        variant={phone ? 'sheet' : 'side'}
        leading={
          phone ? (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                close();
                setListOpen(true);
              }}
            >
              <ArrowLeftIcon />
              {t('links.title')}
            </Button>
          ) : (
            <Button
              variant='ghost'
              size='sm'
              className='text-muted-foreground'
              onClick={() => {
                close();
                onShowDetails();
              }}
            >
              <InfoIcon />
              {t('session.info')}
            </Button>
          )
        }
      />
    ) : null;

  let element: ReactNode = null;
  if (phone) {
    if (panel)
      element = (
        <Sheet onClose={close} tall>
          {panel}
        </Sheet>
      );
    else if (listOpen)
      element = (
        <Sheet onClose={() => setListOpen(false)}>
          <LinkList
            links={links}
            onOpen={open}
            onClose={() => setListOpen(false)}
          />
        </Sheet>
      );
  } else if (panel)
    element = (
      <aside
        // Sized inline: a fixed width beside the conversation, whatever the host's stylesheet scans of this plugin.
        style={{ width: wide ? 500 : 'min(100%, 34rem)' }}
        className={cn(
          'bg-background flex shrink-0 flex-col border-l',
          wide ? 'relative' : 'fixed inset-y-0 right-0 z-50 shadow-xl',
        )}
        aria-label={current?.title || t('links.title')}
        data-testid='link-panel'
      >
        {panel}
      </aside>
    );
  return {
    open,
    openSummary,
    close,
    opened: Boolean(panel),
    element,
  };
}
