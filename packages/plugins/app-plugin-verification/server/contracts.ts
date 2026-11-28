import type {
  CodeTiming,
  PhoneView,
  StepUpCredential,
} from '../shared/contracts.js';

export { changePhonePurpose } from '../shared/contracts.js';
export type {
  CodeTiming,
  PhoneView,
  StepUpCredential,
} from '../shared/contracts.js';

export interface CodePolicy {
  readonly ttlSeconds: number;
  readonly resendSeconds: number;
  readonly hourlyLimit: number;
  readonly maxAttempts: number;
}

export interface VerificationScene extends Partial<CodePolicy> {
  readonly method: string;
  readonly channel: string;
  readonly template: string;
  readonly audience: 'public' | 'signedIn' | 'verifiedPhone';
  /** An optional eligibility check for public sends. Ineligible targets receive the same HTTP response. */
  readonly shouldDeliver?: (target: string) => boolean | Promise<boolean>;
}

export interface VerificationMethod {
  readonly id: string;
  normalizeTarget(target: string): string | undefined;
  /** Deliver once in memory. Never persist or log the code. */
  deliver(input: {
    channel: string;
    template: string;
    target: string;
    code: string;
  }): Promise<boolean>;
}

export interface SendCodeInput {
  readonly scene: string;
  readonly target?: string;
  readonly userId?: string;
  readonly purpose?: string;
  /** An anonymous client address resolved from trusted connection metadata and proxy policy. */
  readonly clientAddress?: string;
}

export interface VerifyCodeInput {
  readonly scene: string;
  readonly target?: string;
  readonly userId?: string;
  readonly code: string;
}

export interface StepUpScope {
  readonly userId: string;
  readonly purpose: string;
}

export interface VerificationService {
  registerMethod(method: VerificationMethod): void;
  registerScene(name: string, scene: VerificationScene): void;
  registerStepUpPurpose(
    purpose: string,
    options?: { ttlSeconds?: number },
  ): void;
  send(input: SendCodeInput): Promise<CodeTiming>;
  /** For trusted server flows. Reserved account scenes are consumed by their owning operations. */
  verify(input: VerifyCodeInput): Promise<void>;
  issueStepUp(input: StepUpScope & { code: string }): Promise<StepUpCredential>;
  consumeStepUp(input: StepUpScope & { token?: string }): Promise<void>;
  getPhone(userId: string): Promise<PhoneView>;
  bindPhone(input: {
    userId: string;
    phone: string;
    code: string;
    token?: string;
  }): Promise<PhoneView>;
  findUserIdByPhone(phone: string): Promise<string | undefined>;
}
