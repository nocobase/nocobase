/**
 * Where the panel's header shows the conversation's choices (the agent, the model and its thinking level): the
 * header provides an element, and the conversation renders its choice there instead of in the composer's toolbar.
 * Without one (the full-page view, a conversation rendered alone) the choice stays in the toolbar.
 */
import { createContext, useContext, type Context } from 'react';

export const HeaderChoiceSlotContext: Context<HTMLElement | null> =
  createContext<HTMLElement | null>(null);

export function useHeaderChoiceSlot(): HTMLElement | null {
  return useContext(HeaderChoiceSlotContext);
}
