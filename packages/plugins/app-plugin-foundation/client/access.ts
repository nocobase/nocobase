/** Access to the capability catalog does not grant access to its management APIs. */
export const CAPABILITY_GUIDE_ACCESS = {
  resource: { type: 'page', id: 'capability-guide' },
  action: 'access',
} as const;
