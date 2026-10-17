import type { ReactElement } from 'react';
import { useNavigate } from 'react-router';

/** The browser's Back button: the page underneath when `renderAt` was given earlier entries. */
export function HistoryBack(): ReactElement {
  const navigate = useNavigate();
  return (
    <button
      type='button'
      data-testid='history-back'
      onClick={() => void navigate(-1)}
    >
      back
    </button>
  );
}
