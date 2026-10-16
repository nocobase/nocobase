import { useTranslation } from '@nocobase/i18n/client';
import { ZoomInIcon, ZoomOutIcon } from 'lucide-react';
import { useCallback, useState, type ReactElement } from 'react';

import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog.js';

/** The transcript keeps its original source; only the overlay's display size changes. */
export function ConversationImage({
  src,
}: {
  readonly src: string;
}): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const container = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const measure = (): void =>
      setViewport({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fit =
    natural.width && natural.height
      ? Math.min(
          1,
          viewport.width / natural.width,
          viewport.height / natural.height,
        )
      : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        setZoom(1);
      }}
    >
      <DialogTrigger
        aria-label={t('transcript.image.open')}
        className='max-w-full cursor-zoom-in rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring'
      >
        <img
          src={src}
          alt=''
          className='max-h-40 max-w-full rounded-lg border object-contain'
        />
      </DialogTrigger>
      <DialogContent className='flex h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] flex-col sm:max-w-[calc(100%-2rem)]'>
        <div className='flex flex-wrap items-center gap-2 pr-10'>
          <DialogTitle className='mr-auto'>
            {t('transcript.image.preview')}
          </DialogTitle>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={t('transcript.image.zoomOut')}
            disabled={zoom <= 1}
            onClick={() => setZoom((value) => Math.max(1, value / 1.5))}
          >
            <ZoomOutIcon />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={t('transcript.image.zoomIn')}
            disabled={zoom >= 8}
            onClick={() => setZoom((value) => Math.min(8, value * 1.5))}
          >
            <ZoomInIcon />
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setZoom(1)}
          >
            {t('transcript.image.fit')}
          </Button>
        </div>
        <div
          ref={container}
          className='min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg bg-muted/30'
        >
          <div
            className='grid min-h-full min-w-full place-items-center'
            style={
              fit
                ? {
                    width: natural.width * fit * zoom,
                    height: natural.height * fit * zoom,
                  }
                : undefined
            }
          >
            <img
              src={src}
              alt={t('transcript.image.preview')}
              className='block max-w-none'
              style={
                fit
                  ? {
                      width: natural.width * fit * zoom,
                      height: natural.height * fit * zoom,
                    }
                  : { maxWidth: '100%', maxHeight: '100%' }
              }
              onLoad={(event) =>
                setNatural({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                })
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
