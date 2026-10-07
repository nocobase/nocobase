import { createContext, useContext } from 'react';
import type { AIWorkContextItem } from './types.js';

export type AIPageContextResolver = (
  items: AIWorkContextItem[],
) => Promise<AIWorkContextItem[]>;

export const AIPageContextResolverContext = createContext<
  AIPageContextResolver | undefined
>(undefined);

const EMPTY_PAGE_CONTEXT: AIWorkContextItem[] = [];

export const AIPageContextScopeContext = createContext(EMPTY_PAGE_CONTEXT);

export const useAIPageContextResolver = () =>
  useContext(AIPageContextResolverContext);

export const useAIPageContextScope = () =>
  useContext(AIPageContextScopeContext);
