import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';

import { isE164 } from '@nocobase/app-plugin-notification-providers/sms';
import { ApiError, type ApiErrorStatus } from '@nocobase/app-server/router';
import type { SecretsService } from '@nocobase/app-server/secrets';
import {
  isUniqueConstraintViolation,
  RepositoryError,
  type DatabaseManager,
  type Row,
} from '@nocobase/db';

import {
  nameSchema,
  policySchema,
  verificationConfigSchema,
  type VerificationConfig,
} from '../config.js';
import {
  changePhonePurpose,
  type CodePolicy,
  type CodeTiming,
  type PhoneView,
  type StepUpCredential,
  type SendCodeInput,
  type StepUpScope,
  type VerificationMethod,
  type VerificationScene,
  type VerificationService,
  type VerifyCodeInput,
} from '../contracts.js';

const hour = 3_600_000;
const maxConflicts = 8;

interface VersionedRow extends Row {
  version: number;
}

interface PhoneRow extends VersionedRow {
  userId: string;
  phone: string;
  bindingId: string;
}

interface CodeRow extends VersionedRow {
  id: string;
  challengeId: string;
  sentAt: string;
  codeHash: string | null;
  keyVersion: number;
  attempts: number;
  expiresAt: string;
}

interface NumberLimitRow extends VersionedRow {
  id: string;
  sentAt: string;
  windowStartedAt: string;
  windowCount: number;
}

interface StepUpRow extends VersionedRow {
  id: string;
  bindingId: string;
  tokenHash: string | null;
  expiresAt: string;
}

interface RegisteredScene extends VerificationScene {
  readonly transport: VerificationMethod;
  readonly policy: CodePolicy;
}

interface Challenge {
  readonly scene: RegisteredScene;
  readonly id: string;
  readonly target: string;
  readonly userId?: string;
}

interface Options {
  readonly database: DatabaseManager;
  readonly secrets: Pick<SecretsService, 'keyring'>;
  readonly config?: VerificationConfig;
  readonly sms: VerificationMethod;
  readonly incrementSender: (key: string, ttl: number) => Promise<number>;
  readonly audit: (event: {
    event: string;
    scene?: string;
    userId?: string;
  }) => void;
  readonly clock?: () => number;
}

export function verificationError(
  status: ApiErrorStatus,
  reason: string,
  message: string,
  metadata?: Record<string, unknown>,
): ApiError {
  return new ApiError({
    status,
    reason,
    message,
    domain: 'verification',
    metadata,
  });
}

function invalidCode() {
  return verificationError(
    'FAILED_PRECONDITION',
    'VERIFICATION_CODE_INVALID',
    'The code is incorrect, expired, or already used.',
  );
}

function invalidToken() {
  return verificationError(
    'PERMISSION_DENIED',
    'VERIFICATION_STEP_UP_REQUIRED',
    'A valid step-up credential is required.',
  );
}

function busy() {
  return verificationError(
    'UNAVAILABLE',
    'VERIFICATION_BUSY',
    'Verification is temporarily busy. Try again.',
  );
}

function limited(reason: string, retry: number, now: number) {
  return verificationError(
    'RESOURCE_EXHAUSTED',
    reason,
    'Wait before requesting another code.',
    {
      retryAt: new Date(retry).toISOString(),
      retryAfterSeconds: Math.max(1, Math.ceil((retry - now) / 1000)),
    },
  );
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function scopeId(...scope: (string | undefined)[]): string {
  return digest(JSON.stringify(scope));
}

function codeDigest(
  key: string,
  id: string,
  challengeId: string,
  code: string,
) {
  return createHmac('sha256', key)
    .update(JSON.stringify([id, challengeId, code]))
    .digest('hex');
}

function sameDigest(left: string, right: string): boolean {
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

function stale(error: unknown): boolean {
  return (
    error instanceof RepositoryError &&
    (error.code === 'VERSION_CONFLICT' || error.code === 'RECORD_NOT_FOUND')
  );
}

export class DefaultVerificationService implements VerificationService {
  private readonly methods = new Map<string, VerificationMethod>();
  private readonly scenes = new Map<string, RegisteredScene>();
  private readonly purposes = new Map<string, number>();
  private readonly config: ReturnType<typeof verificationConfigSchema.parse>;
  private readonly clock: () => number;

  constructor(private readonly options: Options) {
    this.config = verificationConfigSchema.parse(options.config ?? {});
    this.clock = options.clock ?? Date.now;
    this.registerMethod(options.sms);
    if (this.config.bindPhone) {
      this.addScene('bindPhone', {
        ...this.config.bindPhone,
        method: 'sms',
        audience: 'signedIn',
      });
    }
    if (this.config.stepUp) {
      this.addScene('stepUp', {
        ...this.config.stepUp,
        method: 'sms',
        audience: 'verifiedPhone',
      });
      this.registerStepUpPurpose(changePhonePurpose);
    }
  }

  registerMethod(method: VerificationMethod): void {
    nameSchema.parse(method.id);
    if (this.methods.has(method.id))
      throw new Error('Verification method is already registered.');
    this.methods.set(method.id, method);
  }

  registerScene(name: string, scene: VerificationScene): void {
    if (name === 'bindPhone' || name === 'stepUp')
      throw new Error(
        'Configure reserved verification scenes through verification settings.',
      );
    if (scene.shouldDeliver && scene.audience !== 'public')
      throw new Error(
        'Delivery eligibility is supported for public verification scenes.',
      );
    this.addScene(name, scene);
  }

  registerStepUpPurpose(
    purpose: string,
    options: { ttlSeconds?: number } = {},
  ): void {
    nameSchema.parse(purpose);
    if (this.purposes.has(purpose))
      throw new Error('Step-up purpose is already registered.');
    const ttl = options.ttlSeconds ?? this.config.stepUpTtlSeconds;
    if (!Number.isSafeInteger(ttl) || ttl < 1 || ttl > 3600)
      throw new Error('Step-up TTL must be between 1 and 3600 seconds.');
    this.purposes.set(purpose, ttl);
  }

  private addScene(name: string, scene: VerificationScene): void {
    nameSchema.parse(name);
    const transport = this.methods.get(scene.method);
    if (
      !transport ||
      this.scenes.has(name) ||
      !scene.channel ||
      !scene.template
    )
      throw new Error('Invalid or duplicate verification scene.');
    const policy = policySchema.parse({
      ttlSeconds: scene.ttlSeconds ?? this.config.defaults.ttlSeconds,
      resendSeconds: scene.resendSeconds ?? this.config.defaults.resendSeconds,
      hourlyLimit: scene.hourlyLimit ?? this.config.defaults.hourlyLimit,
      maxAttempts: scene.maxAttempts ?? this.config.defaults.maxAttempts,
    });
    this.scenes.set(name, { ...scene, transport, policy });
  }

  async send(input: SendCodeInput): Promise<CodeTiming> {
    const now = this.clock();
    await this.reserveSender(input, now);
    const scene = this.scene(input.scene);
    if (scene.audience !== 'public' && !input.userId)
      throw verificationError(
        'UNAUTHENTICATED',
        'AUTHENTICATION_REQUIRED',
        'Sign in to use this verification scene.',
      );
    if (input.scene === 'stepUp') this.purpose(input.purpose);
    else if (input.purpose !== undefined)
      throw verificationError(
        'INVALID_ARGUMENT',
        'VERIFICATION_PURPOSE_UNEXPECTED',
        'A purpose is only accepted for step-up codes.',
      );

    const binding =
      (scene.audience === 'verifiedPhone' || input.scene === 'bindPhone') &&
      input.userId
        ? await this.phone(input.userId)
        : undefined;
    const challenge = this.challenge(input, scene, binding);
    const [key] = this.options.secrets.keyring('nocobase/verification/code');
    if (!key)
      throw new Error('Verification requires an application secrets key.');

    let resendAt: string;
    try {
      resendAt = await this.reserveNumber(challenge, now);
    } catch (error) {
      this.audit('code.rejected', input.scene, challenge.userId);
      throw error;
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const challengeId = randomUUID();
    const expiresAt = new Date(
      now + scene.policy.ttlSeconds * 1000,
    ).toISOString();
    // Reserve a new challenge before submission. A previous challenge becomes invalid even if delivery fails.
    const values = {
      challengeId,
      sentAt: new Date(now).toISOString(),
      codeHash: null,
      keyVersion: key.version,
      attempts: 0,
      expiresAt,
    };
    const codes = this.options.database.repository('verificationCodes');
    const previous = (await codes.findOne({ filter: { id: challenge.id } })) as
      CodeRow | undefined;
    if (previous && Date.parse(previous.sentAt) >= now) throw busy();
    if (
      !(await this.writeVersioned(
        'verificationCodes',
        challenge.id,
        previous,
        values,
      ))
    )
      throw busy();

    let delivered = false;
    try {
      if (
        !scene.shouldDeliver ||
        (await scene.shouldDeliver(challenge.target))
      ) {
        delivered = await scene.transport.deliver({
          channel: scene.channel,
          template: scene.template,
          target: challenge.target,
          code,
        });
      }
    } catch {
      // Provider and eligibility exceptions may contain the message or private settings.
    }
    let active = false;
    if (delivered) {
      const current = (await codes.findOne({
        filter: { id: challenge.id },
      })) as CodeRow | undefined;
      if (current?.challengeId === challengeId) {
        active = await this.writeVersioned(
          'verificationCodes',
          challenge.id,
          current,
          {
            codeHash: codeDigest(key.value, challenge.id, challengeId, code),
          },
        );
      }
    }
    this.audit(
      active ? 'code.sent' : 'code.deliveryFailed',
      input.scene,
      challenge.userId,
    );
    if (!active && scene.audience !== 'public')
      throw verificationError(
        'UNAVAILABLE',
        'VERIFICATION_DELIVERY_FAILED',
        'The verification code could not be delivered.',
      );
    return { expiresAt, resendAt };
  }

  async verify(input: VerifyCodeInput): Promise<void> {
    if (input.scene === 'bindPhone' || input.scene === 'stepUp')
      throw invalidCode();
    const scene = this.scene(input.scene);
    const binding =
      scene.audience === 'verifiedPhone' && input.userId
        ? await this.phone(input.userId)
        : undefined;
    await this.consumeCode(
      input.scene,
      this.challenge(input, scene, binding),
      input.code,
    );
  }

  async issueStepUp(
    input: StepUpScope & { code: string },
  ): Promise<StepUpCredential> {
    const ttl = this.purpose(input.purpose);
    const binding = await this.phone(input.userId);
    if (!binding) throw invalidToken();
    const scene = this.scene('stepUp');
    await this.consumeCode(
      'stepUp',
      this.challenge({ ...input, scene: 'stepUp' }, scene, binding),
      input.code,
    );

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(this.clock() + ttl * 1000).toISOString();
    const id = scopeId(input.userId, input.purpose);
    const repository = this.options.database.repository(
      'verificationStepUpTokens',
    );
    const values = {
      userId: input.userId,
      bindingId: binding.bindingId,
      tokenHash: digest(token),
      expiresAt,
    };
    for (let attempt = 0; attempt < maxConflicts; attempt++) {
      const row = (await repository.findOne({ filter: { id } })) as
        StepUpRow | undefined;
      if (
        await this.writeVersioned('verificationStepUpTokens', id, row, values)
      ) {
        this.audit('stepUp.issued', undefined, input.userId);
        return { token, expiresAt };
      }
    }
    throw busy();
  }

  async consumeStepUp(input: StepUpScope & { token?: string }): Promise<void> {
    const binding = await this.phone(input.userId);
    await this.consumeCredential(
      input.userId,
      await this.checkCredential(input, binding),
    );
  }

  private async checkCredential(
    input: StepUpScope & { token?: string },
    binding?: PhoneRow,
  ): Promise<StepUpRow> {
    if (
      binding &&
      input.token &&
      /^[A-Za-z0-9_-]{43}$/.test(input.token) &&
      this.purposes.has(input.purpose)
    ) {
      const id = scopeId(input.userId, input.purpose);
      const row = (await this.options.database
        .repository('verificationStepUpTokens')
        .findOne({ filter: { id } })) as StepUpRow | undefined;
      if (
        row?.tokenHash &&
        row.bindingId === binding.bindingId &&
        Date.parse(row.expiresAt) > this.clock() &&
        sameDigest(row.tokenHash, digest(input.token))
      ) {
        return row;
      }
    }
    this.audit('stepUp.rejected', undefined, input.userId);
    throw invalidToken();
  }

  private async consumeCredential(
    userId: string,
    row: StepUpRow,
  ): Promise<void> {
    if (
      Date.parse(row.expiresAt) <= this.clock() ||
      !(await this.writeVersioned('verificationStepUpTokens', row.id, row, {
        tokenHash: null,
      }))
    ) {
      this.audit('stepUp.rejected', undefined, userId);
      throw invalidToken();
    }
    this.audit('stepUp.used', undefined, userId);
  }

  async getPhone(userId: string): Promise<PhoneView> {
    const binding = await this.phone(userId);
    return { phone: binding ? `••••${binding.phone.slice(-4)}` : null };
  }

  async bindPhone(input: {
    userId: string;
    phone: string;
    code: string;
    token?: string;
  }): Promise<PhoneView> {
    const binding = await this.phone(input.userId);
    const scene = this.scene('bindPhone');
    // Check the old proof before testing the new code. Consume it only after the code succeeds.
    const credential = binding
      ? await this.checkCredential(
          { ...input, purpose: changePhonePurpose },
          binding,
        )
      : undefined;
    const challenge = this.challenge(
      { ...input, scene: 'bindPhone', target: input.phone },
      scene,
      binding,
    );
    await this.consumeCode('bindPhone', challenge, input.code);
    if (credential) await this.consumeCredential(input.userId, credential);
    const values = {
      phone: challenge.target,
      bindingId: randomUUID(),
      verifiedAt: new Date(this.clock()).toISOString(),
    };
    const repository = this.options.database.repository('userPhones');
    try {
      if (binding) {
        await repository.updateOne({
          filter: { userId: input.userId },
          ifVersion: binding.version,
          values,
        });
      } else {
        await repository.createOne({
          values: { userId: input.userId, ...values },
        });
      }
    } catch (error) {
      if (isUniqueConstraintViolation(error) || stale(error)) {
        throw verificationError(
          'ABORTED',
          'VERIFICATION_PHONE_BINDING_CONFLICT',
          'The phone could not be bound. Start verification again.',
        );
      }
      throw error;
    }
    this.audit('phone.bound', 'bindPhone', input.userId);
    return { phone: `••••${challenge.target.slice(-4)}` };
  }

  async findUserIdByPhone(phone: string): Promise<string | undefined> {
    if (!isE164(phone)) return undefined;
    const row = (await this.options.database
      .repository('userPhones')
      .findOne({ filter: { phone } })) as PhoneRow | undefined;
    return row?.userId;
  }

  async find(userIds: readonly string[]): Promise<ReadonlyMap<string, string>> {
    const phones = new Map<string, string>();
    for (let index = 0; index < userIds.length; index += 500) {
      const rows = await this.options.database
        .query()
        .selectFrom<PhoneRow>('userPhones')
        .select(['userId', 'phone'])
        .where('userId', 'in', userIds.slice(index, index + 500))
        .execute<Pick<PhoneRow, 'userId' | 'phone'>>();
      for (const row of rows) phones.set(row.userId, row.phone);
    }
    return phones;
  }

  private async phone(userId: string): Promise<PhoneRow | undefined> {
    const row = await this.options.database
      .repository('userPhones')
      .findOne({ filter: { userId } });
    return (row ?? undefined) as PhoneRow | undefined;
  }

  private scene(name: string): RegisteredScene {
    const scene = this.scenes.get(name);
    if (!scene)
      throw verificationError(
        'INVALID_ARGUMENT',
        'VERIFICATION_SCENE_UNAVAILABLE',
        'The verification scene is unavailable.',
      );
    return scene;
  }

  private purpose(purpose?: string): number {
    const ttl = purpose && this.purposes.get(purpose);
    if (!ttl || !this.scenes.has('stepUp'))
      throw verificationError(
        'INVALID_ARGUMENT',
        'VERIFICATION_PURPOSE_UNAVAILABLE',
        'The step-up purpose is unavailable.',
      );
    return ttl;
  }

  private challenge(
    input: Omit<SendCodeInput, 'clientAddress'>,
    scene: RegisteredScene,
    binding?: PhoneRow,
  ): Challenge {
    const userId = scene.audience === 'public' ? undefined : input.userId;
    if (scene.audience !== 'public' && !userId) throw invalidCode();
    if (scene.audience === 'verifiedPhone' && !binding) {
      throw verificationError(
        'FAILED_PRECONDITION',
        'VERIFICATION_PHONE_REQUIRED',
        'A verified phone is required.',
      );
    }
    if (scene.audience === 'verifiedPhone' && input.target !== undefined) {
      throw verificationError(
        'INVALID_ARGUMENT',
        'VERIFICATION_TARGET_UNEXPECTED',
        'This scene uses the account’s verified phone.',
      );
    }
    const target = scene.transport.normalizeTarget(
      (scene.audience === 'verifiedPhone' ? binding?.phone : input.target) ??
        '',
    );
    if (!target)
      throw verificationError(
        'INVALID_ARGUMENT',
        'VERIFICATION_TARGET_INVALID',
        'A valid verification target is required.',
      );
    return {
      id: scopeId(
        input.scene,
        target,
        userId,
        binding?.bindingId,
        input.purpose,
      ),
      scene,
      target,
      userId,
    };
  }

  private async reserveSender(
    input: SendCodeInput,
    now: number,
  ): Promise<void> {
    const { userId, clientAddress } = input;
    const end = (Math.floor(now / hour) + 1) * hour;
    const count = await this.options.incrementSender(
      scopeId(userId ? 'user' : 'ip', userId ?? clientAddress, String(end)),
      end - now,
    );
    const limit = userId
      ? this.config.userHourlyLimit
      : this.config.ipHourlyLimit;
    if (count > limit) {
      this.audit(userId ? 'code.userLimit' : 'code.ipLimit', undefined, userId);
      throw limited(
        userId ? 'VERIFICATION_USER_SEND_LIMIT' : 'VERIFICATION_IP_SEND_LIMIT',
        end,
        now,
      );
    }
  }

  private async reserveNumber(
    challenge: Challenge,
    now: number,
  ): Promise<string> {
    const { policy } = challenge.scene;
    const resend =
      Math.max(policy.resendSeconds, this.config.defaults.resendSeconds) * 1000;
    const limit = Math.min(
      policy.hourlyLimit,
      this.config.defaults.hourlyLimit,
    );
    const id = scopeId(challenge.scene.method, challenge.target);
    const repository = this.options.database.repository(
      'verificationNumberLimits',
    );
    for (let attempt = 0; attempt < maxConflicts; attempt++) {
      const row = (await repository.findOne({ filter: { id } })) as
        NumberLimitRow | undefined;
      const start = row ? Date.parse(row.windowStartedAt) : now;
      const inWindow = now < start + hour;
      const count = row && inWindow ? row.windowCount : 0;
      const cooldown = row ? Date.parse(row.sentAt) + resend : now;
      if (count >= limit)
        throw limited(
          'VERIFICATION_NUMBER_SEND_LIMIT',
          Math.max(start + hour, cooldown),
          now,
        );
      if (cooldown > now)
        throw limited('VERIFICATION_SEND_TOO_FREQUENT', cooldown, now);

      const windowStart = inWindow ? start : now;
      const values = {
        sentAt: new Date(now).toISOString(),
        windowStartedAt: new Date(windowStart).toISOString(),
        windowCount: count + 1,
      };
      if (
        await this.writeVersioned('verificationNumberLimits', id, row, values)
      ) {
        return new Date(
          Math.max(
            now + resend,
            count + 1 === limit ? windowStart + hour : now,
          ),
        ).toISOString();
      }
    }
    throw busy();
  }

  private async consumeCode(
    name: string,
    challenge: Challenge,
    code: string,
  ): Promise<void> {
    const repository = this.options.database.repository('verificationCodes');
    const keys = this.options.secrets.keyring('nocobase/verification/code');
    let challengeId: string | undefined;
    for (let attempt = 0; attempt < maxConflicts; attempt++) {
      const row = (await repository.findOne({
        filter: { id: challenge.id },
      })) as CodeRow | undefined;
      if (
        !row?.codeHash ||
        Date.parse(row.expiresAt) <= this.clock() ||
        row.attempts >= challenge.scene.policy.maxAttempts
      )
        break;
      challengeId ??= row.challengeId;
      // A retry after a conflict may count against the same challenge only.
      if (row.challengeId !== challengeId) break;
      const key = keys.find(({ version }) => version === row.keyVersion);
      if (!key) break;
      const valid =
        /^\d{6}$/.test(code) &&
        sameDigest(
          row.codeHash,
          codeDigest(key.value, row.id, row.challengeId, code),
        );
      const attempts = row.attempts + 1;
      const codeHash =
        valid || attempts >= challenge.scene.policy.maxAttempts
          ? null
          : row.codeHash;
      if (
        !(await this.writeVersioned('verificationCodes', row.id, row, {
          codeHash,
          attempts,
        }))
      )
        continue;
      if (valid) {
        this.audit('code.verified', name, challenge.userId);
        return;
      }
      break;
    }
    this.audit('code.failed', name, challenge.userId);
    throw invalidCode();
  }

  private async writeVersioned(
    collection: string,
    id: string,
    row: VersionedRow | undefined,
    values: Record<string, string | number | null>,
  ): Promise<boolean> {
    const repository = this.options.database.repository(collection);
    try {
      if (row)
        await repository.updateOne({
          filter: { id },
          ifVersion: row.version,
          values,
        });
      else await repository.createOne({ values: { id, ...values } });
      return true;
    } catch (error) {
      if (stale(error) || (!row && isUniqueConstraintViolation(error)))
        return false;
      throw error;
    }
  }

  private audit(event: string, scene?: string, userId?: string): void {
    this.options.audit({ event, scene, userId });
  }
}
