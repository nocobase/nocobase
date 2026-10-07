/** Query keys of the inbox hooks. Everything sits under `all`, so one invalidation refreshes the list and the count. */
export interface InboxKeys {
  readonly all: readonly ['notificationInApp', 'inbox'];
  readonly items: readonly ['notificationInApp', 'inbox', 'items'];
  readonly unread: readonly ['notificationInApp', 'inbox', 'unread'];
  /** One paged list; `items` prefixes every page size. */
  page(
    pageSize: number,
  ): readonly ['notificationInApp', 'inbox', 'items', number];
}

export const inboxKeys: InboxKeys = {
  all: ['notificationInApp', 'inbox'],
  items: ['notificationInApp', 'inbox', 'items'],
  unread: ['notificationInApp', 'inbox', 'unread'],
  page: (pageSize) => ['notificationInApp', 'inbox', 'items', pageSize],
};

/** The page size the hooks use when none is given. */
export const INBOX_PAGE_SIZE = 25;
