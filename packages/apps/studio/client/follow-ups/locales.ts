/**
 * The wording of "My follow-ups" (`/follow-ups`), under `followUps` in the application's locales
 * (`client/locales/en-US.ts` and `zh-CN.ts` spread these in).
 */
export const followUpsEnUS = {
  title: 'My follow-ups',
  description:
    'The issues you follow, what is happening on them now, and what your own issues need from you.',
  live: 'Live',
  countsLabel: 'Your issues by status',
  following: {
    title: 'Following · {{count}}/{{max}}',
    empty: 'Nothing followed yet. Star an issue on the right to keep it here.',
    defaults:
      'Showing your blocked and in-review issues until you choose what to follow.',
    unread_one: '{{count}} new update',
    unread_other: '{{count}} new updates',
    needsYou: 'Needs you: {{ask}}',
    viewing: 'Viewing (not followed)',
  },
  activity: {
    label: 'Activity',
    select: 'Choose an issue to see what is happening on it.',
    loadFailed: 'Could not load the issue.',
    back: 'Back to the list',
  },
  mine: {
    title: 'Issues I own',
    filters: 'Filter by status',
    search: 'Search by title or key',
    empty: 'No issues match.',
    emptyAll: 'You own no open issues.',
    truncated: 'Showing the most recent {{max}} issues of a status.',
    follow: 'Follow {{key}}',
    unfollow: 'Stop following {{key}}',
  },
  tabs: {
    label: 'Follow-up lists',
    following: 'Following',
    mine: 'Issues I own',
    badge_one: '{{count}} needs a look',
    badge_other: '{{count}} need a look',
  },
  loadFailed: 'Could not load your follow-ups.',
  saveFailed: 'Could not save what you follow.',
};

export const followUpsZhCN: typeof followUpsEnUS = {
  title: '我的跟进',
  description: '你关注的任务现在进展如何，以及你负责的任务需要你做什么。',
  live: '实时更新',
  countsLabel: '我负责的任务按状态统计',
  following: {
    title: '关注 · {{count}}/{{max}}',
    empty: '还没有关注任务。在右侧点星标即可关注。',
    defaults: '你还没选择关注哪些任务，先显示你待确定和待验收的任务。',
    unread_one: '{{count}} 条新动态',
    unread_other: '{{count}} 条新动态',
    needsYou: '需要你：{{ask}}',
    viewing: '正在查看（未关注）',
  },
  activity: {
    label: '任务动态',
    select: '选择一个任务，查看它的进展。',
    loadFailed: '没有读到这个任务。',
    back: '返回列表',
  },
  mine: {
    title: '我负责的任务',
    filters: '按状态筛选',
    search: '搜索标题或编号',
    empty: '没有符合条件的任务。',
    emptyAll: '你没有未完成的任务。',
    truncated: '每个状态只显示最近的 {{max}} 个任务。',
    follow: '关注 {{key}}',
    unfollow: '取消关注 {{key}}',
  },
  tabs: {
    label: '跟进列表',
    following: '关注',
    mine: '我负责的',
    badge_one: '{{count}} 个需要看',
    badge_other: '{{count}} 个需要看',
  },
  loadFailed: '没有读到你的跟进。',
  saveFailed: '没能保存关注的任务。',
};
