import { ProtocolError } from '../../kernel/errors.js';
import {
  fileInputFailureTitles,
  isFileInputFailureReason,
  type FileInputFailureReason,
} from '../../../shared/file-input-failures.js';

/** A controlled preparation failure, distinct from arbitrary extractor or Provider errors. */
export class FileInputError extends ProtocolError {
  readonly fileInputReason: FileInputFailureReason;
  constructor(reason: FileInputFailureReason) {
    const safe = isFileInputFailureReason(reason)
      ? reason
      : 'preparationFailed';
    super('INVALID_REQUEST', fileInputFailureTitles[safe]);
    this.fileInputReason = safe;
  }
}
