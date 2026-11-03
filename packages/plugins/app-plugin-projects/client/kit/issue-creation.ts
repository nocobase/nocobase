import { createContext, type Context } from 'react';

/** Applications that create through chat can retain only the original manual form as an explicit fallback. */
export const IssueCreationModeContext: Context<'all' | 'manual'> =
  createContext<'all' | 'manual'>('all');
