/** Query keys of the inbox hooks. Everything sits under `all`, so one invalidation refreshes the list and the count. */
export interface InboxKeys {
  readonly all: readonly ['notificationInApp', 'inbox'];
  readonly items: readonly ['notificationInApp', 'inbox', 'items'];
  readonly unread: readonly ['notificationInApp', 'inbox', 'unread'];
  /** Unread items per category. */
  readonly unreadByCategory: readonly [
    'notificationInApp',
    'inbox',
    'unread-by-category',
  ];
  /** One paged list; `items` prefixes every page size and filter. */
  page(
    pageSize: number,
    filters?: InboxListFilters,
  ): readonly [
    'notificationInApp',
    'inbox',
    'items',
    number,
    string | null,
    boolean,
  ];
}

/** What a paged list is narrowed to on the server. */
export interface InboxListFilters {
  readonly category?: string;
  readonly unreadOnly?: boolean;
}

export const inboxKeys: InboxKeys = {
  all: ['notificationInApp', 'inbox'],
  items: ['notificationInApp', 'inbox', 'items'],
  unread: ['notificationInApp', 'inbox', 'unread'],
  unreadByCategory: ['notificationInApp', 'inbox', 'unread-by-category'],
  page: (pageSize, filters) => [
    'notificationInApp',
    'inbox',
    'items',
    pageSize,
    filters?.category ?? null,
    filters?.unreadOnly === true,
  ],
};

/** The page size the hooks use when none is given. */
export const INBOX_PAGE_SIZE = 25;
