import { createContext, type Context } from 'react';

/**
 * How this plugin's pages show their title: `visible`, or `screenReaderOnly` for an application that renders them
 * under a heading or tab bar of its own that already names them. Either way a page keeps its `h1` (read by screen
 * readers), its description and its actions.
 */
export type PageTitleDisplay = 'visible' | 'screenReaderOnly';

/** `visible` unless the application provides `screenReaderOnly` around the pages it embeds. */
export const PageTitleContext: Context<PageTitleDisplay> =
  createContext<PageTitleDisplay>('visible');
