/** Every key the device approval looks up, so each locale is checked against the same list. */
export interface DeviceApprovalLocale {
  readonly 'deviceApproval.title': string;
  readonly 'deviceApproval.description': string;
  readonly 'deviceApproval.enterCode': string;
  readonly 'deviceApproval.codeLabel': string;
  readonly 'deviceApproval.continue': string;
  readonly 'deviceApproval.checking': string;
  readonly 'deviceApproval.confirm': string;
  readonly 'deviceApproval.client': string;
  readonly 'deviceApproval.approve': string;
  readonly 'deviceApproval.approving': string;
  readonly 'deviceApproval.deny': string;
  readonly 'deviceApproval.denying': string;
  readonly 'deviceApproval.approved': string;
  readonly 'deviceApproval.denied': string;
  readonly 'deviceApproval.expired': string;
  readonly 'deviceApproval.invalid': string;
  readonly 'deviceApproval.notYours': string;
  readonly 'deviceApproval.error': string;
  readonly 'deviceApproval.retry': string;
  readonly 'deviceApproval.otherCode': string;
}

const enUS: DeviceApprovalLocale = {
  'deviceApproval.title': 'Authorize a device',
  'deviceApproval.description':
    'A command line or another device asked to sign in as you. Approve it only if you started the sign-in yourself.',
  'deviceApproval.enterCode': 'Enter the code your device shows.',
  'deviceApproval.codeLabel': 'Code',
  'deviceApproval.continue': 'Continue',
  'deviceApproval.checking': 'Checking the code…',
  'deviceApproval.confirm':
    'Check that this code matches the one your device shows.',
  'deviceApproval.client': 'Requested by {{client}}',
  'deviceApproval.approve': 'Approve',
  'deviceApproval.approving': 'Approving…',
  'deviceApproval.deny': 'Deny',
  'deviceApproval.denying': 'Denying…',
  'deviceApproval.approved':
    'Device approved. Return to your terminal to continue; you can close this page.',
  'deviceApproval.denied':
    'Request denied. The device was not signed in; you can close this page.',
  'deviceApproval.expired':
    'This code has expired. Start the sign-in on your device again.',
  'deviceApproval.invalid':
    'This code is not valid. Check it against your device and try again.',
  'deviceApproval.notYours':
    'This code is already being approved by another account.',
  'deviceApproval.error': 'Something went wrong. Try again.',
  'deviceApproval.retry': 'Try again',
  'deviceApproval.otherCode': 'Enter another code',
};

export default enUS;
