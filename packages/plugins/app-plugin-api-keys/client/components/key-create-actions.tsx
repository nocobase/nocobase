import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState, type ReactElement } from 'react';

import { Button } from '#components/ui/button';
import { API_KEYS_NAMESPACE } from '../namespace.js';

export function KeyCreateActions({
  submitting,
  onCancel,
}: {
  readonly submitting: boolean;
  readonly onCancel: () => void;
}): ReactElement {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const endRef = useRef<HTMLSpanElement>(null);
  const [floating, setFloating] = useState(false);

  useEffect(() => {
    if (!endRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      setFloating(!entry.isIntersecting);
    });
    observer.observe(endRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* The last row ends at the form's bottom padding. Include the sticky inset in its marker's position. */}
      <span
        ref={endRef}
        aria-hidden
        className='pointer-events-none absolute right-4 bottom-4 size-px translate-y-3 sm:bottom-6'
      />
      <div
        className={`sticky bottom-3 z-10 flex flex-wrap items-center justify-end gap-2 rounded-lg border bg-card px-4 py-2.5 text-card-foreground ${floating ? 'border-border shadow-sm' : 'border-transparent'}`}
      >
        <Button type='button' variant='outline' onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type='submit' disabled={submitting}>
          {submitting ? t('create.submitting') : t('create.submit')}
        </Button>
      </div>
    </>
  );
}
