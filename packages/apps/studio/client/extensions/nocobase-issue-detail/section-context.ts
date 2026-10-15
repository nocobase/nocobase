import { createContext, type Context } from 'react';

/**
 * Set where a part is shown under a tab named like it (the split view's task detail): its heading is read out but not
 * drawn again, and it needs no divider above it.
 */
export const IssueSectionInTabContext: Context<boolean> = createContext(false);
