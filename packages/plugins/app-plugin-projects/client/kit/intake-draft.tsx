/* eslint-disable react-refresh/only-export-components -- draft provider and its hook */
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
  type ReactElement,
} from 'react';
import type { IntakeFile } from '../../shared/intake.js';

export interface IntakeDraft {
  readonly text: string;
  readonly projectId: string | null | undefined;
  readonly uploads: readonly {
    readonly key: string;
    readonly name: string;
    readonly file: IntakeFile | null;
  }[];
}
export const emptyIntakeDraft = (): IntakeDraft => ({
  text: '',
  projectId: undefined,
  uploads: [],
});
const DraftContext = createContext<
  readonly [IntakeDraft, Dispatch<SetStateAction<IntakeDraft>>] | null
>(null);

/** Optional application-lifetime owner; without one, the panel retains its local behavior. */
export function IntakeDraftProvider({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const [draft, setDraft] = useState<IntakeDraft>(emptyIntakeDraft);
  return (
    <DraftContext.Provider value={[draft, setDraft]}>
      {children}
    </DraftContext.Provider>
  );
}
export function useIntakeDraft(): readonly [
  IntakeDraft,
  Dispatch<SetStateAction<IntakeDraft>>,
] {
  const shared = useContext(DraftContext);
  const [draft, setDraft] = useState<IntakeDraft>(emptyIntakeDraft);
  return shared ?? [draft, setDraft];
}
