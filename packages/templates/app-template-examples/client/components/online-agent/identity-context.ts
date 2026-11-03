import { createContext, useContext } from 'react';

export const OnlineAgentIdentityContext = createContext<(() => boolean) | null>(
  null,
);

export function useOnlineAgentIdentityActive(): () => boolean {
  const isActive = useContext(OnlineAgentIdentityContext);
  if (!isActive)
    throw new Error(
      'OnlineAgent actions require an authenticated identity scope.',
    );
  return isActive;
}
