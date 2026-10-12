import type { LocaleResource } from '@nocobase/i18n';
const enUS = {
  passwordResetEmail: {
    subject: 'Reset your {{app}} password',
    text: 'Hello {{name}},\nReset your password: {{url}}\nIf you did not request this, ignore this email.',
    html: '<p>Hello {{name}},</p><p><a href="{{url}}">Reset your password</a></p><p>If you did not request this, ignore this email.</p>',
  },
};
export type AuthenticationServerResource = LocaleResource<typeof enUS>;
export default enUS;
