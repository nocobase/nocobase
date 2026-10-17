/** Applications may describe their own principal kinds without changing executor eligibility. */
import { createContext, type ComponentType, type Context } from 'react';
export interface ExecutorPresentationProps {
  readonly id: string;
  readonly name: string;
  readonly place: 'trigger' | 'menu';
}
export interface ExecutorPresentation {
  readonly kind: string;
  readonly Component: ComponentType<ExecutorPresentationProps>;
}
export const ExecutorPresentationContext: Context<ExecutorPresentation | null> =
  createContext<ExecutorPresentation | null>(null);
