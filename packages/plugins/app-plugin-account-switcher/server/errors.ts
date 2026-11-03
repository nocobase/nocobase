import { ApiError } from '@nocobase/app-server/router';

const domain = 'accountSwitcher';

/** The switch ran out mid-way. Silently acting as the signed-in person instead could apply a stale page's write as them. */
export function accountSwitchEnded(): ApiError {
  return new ApiError({
    status: 'ABORTED',
    reason: 'ACCOUNT_SWITCH_ENDED',
    domain,
    message: 'The account switch has ended. Reload the page.',
  });
}

export function accountSwitchNotAllowed(): ApiError {
  return new ApiError({
    status: 'PERMISSION_DENIED',
    reason: 'ACCOUNT_SWITCH_NOT_ALLOWED',
    domain,
    message: 'Only a Super Admin can switch accounts.',
  });
}

export function accountSwitchBrowserOnly(): ApiError {
  return new ApiError({
    status: 'PERMISSION_DENIED',
    reason: 'ACCOUNT_SWITCH_BROWSER_ONLY',
    domain,
    message: 'Accounts can only be switched from a signed-in browser session.',
  });
}

export function accountSwitchForbiddenAction(): ApiError {
  return new ApiError({
    status: 'PERMISSION_DENIED',
    reason: 'ACCOUNT_SWITCH_FORBIDDEN_ACTION',
    domain,
    message:
      'Credentials and account settings cannot be changed while acting as another account. Return to your own account first.',
  });
}

export function accountNotSwitchable(userId: string): ApiError {
  return new ApiError({
    status: 'INVALID_ARGUMENT',
    reason: 'ACCOUNT_NOT_SWITCHABLE',
    domain,
    message: `Account ${userId} cannot be switched to.`,
    fieldViolations: [
      {
        field: 'userId',
        description:
          'Must be another enabled person account that is not your own.',
      },
    ],
  });
}
