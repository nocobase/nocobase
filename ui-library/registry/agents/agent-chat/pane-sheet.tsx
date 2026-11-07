/**
 * shadcn's `sheet`, adapted to open inside a pane rather than over the window: the content portals into `container`
 * (a `relative` element such as the conversation pane), its backdrop and popup are `absolute` within it, the backdrop
 * also renders when nested in another dialog (the phone chat panel is one), and the dialog traps focus and closes on
 * Escape or a press outside its popup while everything outside the pane stays usable. Classes, animations, the close
 * button and the semantic tokens follow `components/ui/sheet.tsx`, which stays untouched.
 */
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import { XIcon } from 'lucide-react';
import type { ComponentProps, ReactElement, RefObject } from 'react';
import { cn } from 'cn';
import { Button } from '#components/ui/button';
import { useChatTranslation } from './chat-i18n.js';

export function PaneSheet({
  modal = 'trap-focus',
  ...props
}: SheetPrimitive.Root.Props): ReactElement {
  return <SheetPrimitive.Root data-slot='sheet' modal={modal} {...props} />;
}

export interface PaneSheetContentProps extends SheetPrimitive.Popup.Props {
  /** The `relative` element the sheet opens within. */
  readonly container: HTMLElement | RefObject<HTMLElement | null> | null;
  readonly showCloseButton?: boolean;
}

export function PaneSheetContent({
  className,
  children,
  container,
  showCloseButton = true,
  ...props
}: PaneSheetContentProps): ReactElement {
  const { t } = useChatTranslation();
  return (
    <SheetPrimitive.Portal data-slot='sheet-portal' container={container}>
      {/* The popup starts translated past the pane's right edge. Without this clip that overhang made an
          `overflow: hidden` ancestor scrollable, and focusing the popup scrolled it, shifting the conversation behind
          the overlay sideways for the length of the slide (WebKit). `overflow: clip` cannot be scrolled at all. */}
      <div
        data-slot='sheet-layer'
        className='absolute inset-0 z-50 overflow-clip'
      >
        <SheetPrimitive.Backdrop
          forceRender
          data-slot='sheet-overlay'
          className='absolute inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs'
        />
        <SheetPrimitive.Popup
          data-slot='sheet-content'
          data-side='right'
          className={cn(
            'absolute inset-y-0 right-0 z-50 flex h-full w-3/4 flex-col gap-4 border-l bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-ending-style:translate-x-[2.5rem] data-ending-style:opacity-0 data-starting-style:translate-x-[2.5rem] data-starting-style:opacity-0 sm:max-w-sm',
            className,
          )}
          {...props}
        >
          {children}
          {showCloseButton && (
            <SheetPrimitive.Close
              data-slot='sheet-close'
              render={
                <Button
                  variant='ghost'
                  className='absolute top-3 right-3'
                  size='icon-sm'
                />
              }
            >
              <XIcon />
              <span className='sr-only'>{t('chat.close')}</span>
            </SheetPrimitive.Close>
          )}
        </SheetPrimitive.Popup>
      </div>
    </SheetPrimitive.Portal>
  );
}

export function PaneSheetHeader({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot='sheet-header'
      className={cn('flex flex-col gap-0.5 p-4', className)}
      {...props}
    />
  );
}

export function PaneSheetTitle({
  className,
  ...props
}: SheetPrimitive.Title.Props): ReactElement {
  return (
    <SheetPrimitive.Title
      data-slot='sheet-title'
      className={cn('text-base font-medium text-foreground', className)}
      {...props}
    />
  );
}
