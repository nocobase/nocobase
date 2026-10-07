export {
  SecretsError,
  isSecretsError,
  type SecretsErrorCode,
} from './errors.js';
export {
  MIN_SECRET_KEY_BYTES,
  decodeSecretKey,
  generateSecretKey,
  parseSecretKeysEnv,
  validateSecretKeys,
  type SecretKeyEntry,
  type SecretKeyIssue,
} from './keys.js';
export {
  SECRETS_ENVELOPE_PREFIX,
  SECRETS_HKDF_SALT,
  createKeyring,
  inspectSecret,
  isSealedSecret,
  type DerivedSecret,
  type Keyring,
  type SecretsEnvelopeInfo,
  type SecretsSealOptions,
} from './keyring.js';
