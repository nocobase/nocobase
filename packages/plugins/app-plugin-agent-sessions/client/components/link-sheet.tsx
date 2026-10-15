/** The phone's sheets for a session's records (`link-panel.tsx`): the list, and the sheet a record opens in. */
import { useTranslation } from '@nocobase/i18n/client';
import { ListChecksIcon, XIcon } from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';

import type { SessionLink } from '../../shared/api.js';
import { byIcon, linkIcon, linkNeedsYou, waitingFirst } from '../lib/tones.js';
import { LinkBar } from './link-bar.js';
import { StatusIcon } from './status-icon.js';
import { StatusPill } from './status-pill.js';
import { Button } from './ui/button.js';
import { WaitingCount } from './waiting-count.js';

/** A sheet from the bottom of a phone's screen: half of it for the list, nearly all of it for a record. */
export function Sheet({
  children,
  onClose,
  tall = false,
}: {
  readonly children: ReactNode;
  readonly onClose: () => void;
  readonly tall?: boolean;
}): ReactElement {
  const [start, setStart] = useState<number | null>(null);
  const [drag, setDrag] = useState(0);
  return (
    <>
      <div
        aria-hidden
        className='fixed inset-0 z-40 bg-black/40'
        onClick={onClose}
      />
      <div
        role='dialog'
        aria-modal='true'
        data-testid='link-sheet'
        className='bg-background fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-2xl shadow-2xl'
        style={{
          height: tall ? '94dvh' : '55dvh',
          ...(drag > 0 ? { transform: `translateY(${drag}px)` } : {}),
        }}
      >
        {/* Pulling the handle down closes the sheet. */}
        <div
          className='flex shrink-0 touch-none justify-center py-2'
          onPointerDown={(event) => setStart(event.clientY)}
          onPointerMove={(event) => {
            if (start !== null) setDrag(Math.max(0, event.clientY - start));
          }}
          onPointerUp={() => {
            if (drag > 80) onClose();
            setStart(null);
            setDrag(0);
          }}
        >
          <span className='bg-muted-foreground/30 h-1 w-10 rounded-full' />
        </div>
        <div className='flex min-h-0 flex-1 flex-col'>{children}</div>
      </div>
    </>
  );
}

/** The session's records in the phone's sheet, those waiting for the viewer first. */
export function LinkList({
  links,
  onOpen,
  onClose,
}: {
  readonly links: readonly SessionLink[];
  readonly onOpen: (link: SessionLink) => boolean;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const waiting = links.filter(linkNeedsYou).length;
  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex items-center gap-2 border-b px-4 pb-3'>
        <ListChecksIcon className='size-4' />
        <span className='text-base font-semibold'>
          {t('links.title')} {links.length}
        </span>
        <LinkBar links={byIcon(links)} className='w-20' />
        {waiting > 0 && <WaitingCount count={waiting} />}
        <Button
          variant='ghost'
          size='icon-sm'
          className='ml-auto'
          aria-label={t('actions.close')}
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>
      <ul className='min-h-0 flex-1 overflow-y-auto'>
        {waitingFirst(links).map((link) => (
          <li key={`${link.kind}:${link.refId}`}>
            <button
              type='button'
              className='hover:bg-muted flex min-h-14 w-full items-center gap-2.5 border-b px-4 py-2 text-left'
              onClick={() => onOpen(link)}
            >
              <StatusIcon icon={linkIcon(link)} />
              <span className='text-muted-foreground shrink-0 font-mono text-xs'>
                {link.key}
              </span>
              <span className='min-w-0 flex-1 truncate text-sm'>
                {link.title}
              </span>
              {link.status && <StatusPill status={link.status} />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
