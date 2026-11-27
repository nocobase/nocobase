export const changePhonePurpose = 'verification.changePhone';

export interface SendVerificationCodeInput {
  readonly scene: string;
  readonly phone?: string;
  readonly purpose?: string;
}

export interface IssueStepUpTokenInput {
  readonly purpose: string;
  readonly code: string;
}

export interface BindPhoneInput {
  readonly phone: string;
  readonly code: string;
}

export interface CodeTiming {
  readonly expiresAt: string;
  readonly resendAt: string;
}

export interface StepUpCredential {
  readonly token: string;
  readonly expiresAt: string;
}

export interface PhoneView {
  /** The masked number, or null when the account has no verified phone. */
  readonly phone: string | null;
}
