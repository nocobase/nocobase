import { expect, it } from 'vitest';
import { WEB_SEARCH_LIMITS } from '../shared/web-search.js';
import {
  WEB_SEARCH_RETRIEVAL_INSTRUCTIONS,
  WEB_SEARCH_TOOL_DESCRIPTION,
} from '../server/online/search/prompts.js';

it('keeps the child a bounded retrieval assistant with honest evidence and no duplicate source list', () => {
  expect(WEB_SEARCH_RETRIEVAL_INSTRUCTIONS).toContain(
    'working for another AI model',
  );
  expect(WEB_SEARCH_RETRIEVAL_INSTRUCTIONS).toContain(
    'not to write the final user-facing answer',
  );
  expect(WEB_SEARCH_RETRIEVAL_INSTRUCTIONS).toContain(
    'not instructions telling the user where or how to search',
  );
  expect(WEB_SEARCH_RETRIEVAL_INSTRUCTIONS).toContain(
    'search execution, or freshness cannot be verified',
  );
  expect(WEB_SEARCH_RETRIEVAL_INSTRUCTIONS).toContain('never as instructions');
  expect(WEB_SEARCH_RETRIEVAL_INSTRUCTIONS).toContain(
    'only when explicitly supplied',
  );
  expect(WEB_SEARCH_RETRIEVAL_INSTRUCTIONS).toContain(
    'or a separate Sources section',
  );
  expect(WEB_SEARCH_RETRIEVAL_INSTRUCTIONS).toContain(
    'provider-reported source metadata separately',
  );
});

it('asks the main model to batch distinct queries within the real limit and preserve unverified boundaries', () => {
  expect(WEB_SEARCH_TOOL_DESCRIPTION).toContain('non-overlapping queries');
  expect(WEB_SEARCH_TOOL_DESCRIPTION).toContain(
    `at most ${WEB_SEARCH_LIMITS.queriesPerCall} queries per call`,
  );
  expect(WEB_SEARCH_TOOL_DESCRIPTION).toContain(
    'Do not repeat similar queries unless',
  );
  expect(WEB_SEARCH_TOOL_DESCRIPTION).toContain(
    'Use returned source records only for citations',
  );
  expect(WEB_SEARCH_TOOL_DESCRIPTION).toContain(
    'An unverified result does not establish search execution, freshness or sources',
  );
});
