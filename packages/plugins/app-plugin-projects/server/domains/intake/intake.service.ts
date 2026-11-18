import {
  INTAKE_FILES_MAX,
  type IntakeFile,
  type IntakeTextsRequest,
  type IntakeTextsResult,
} from '../../../shared/intake.js';
import type { Viewer } from '../../access/viewer.js';
import { invalid } from '../../kernel/errors.js';
import type { IntakeFileStore } from './intake.files.js';
import { readIntakeTexts, type ExtractOffice } from './intake.text.js';

export interface IntakeService {
  upload(viewer: Viewer, file: File): Promise<IntakeFile>;
  removeFile(viewer: Viewer, id: string): Promise<void>;
  texts(viewer: Viewer, input: IntakeTextsRequest): Promise<IntakeTextsResult>;
}

export function createIntakeService(deps: {
  readonly files: IntakeFileStore;
  readonly extract?: ExtractOffice;
}): IntakeService {
  return {
    upload: (viewer, file) => deps.files.upload(viewer.userId, file),

    removeFile: (viewer, id) => deps.files.remove(viewer.userId, id),

    async texts(viewer, input) {
      const fileIds = Array.isArray(input.fileIds)
        ? input.fileIds.filter((id): id is string => typeof id === 'string')
        : [];
      if (fileIds.length > INTAKE_FILES_MAX)
        throw invalid(
          'INVALID_INTAKE',
          `At most ${INTAKE_FILES_MAX} files may be read at once.`,
        );
      const files = await deps.files.owned(viewer.userId, fileIds);
      const texts = await readIntakeTexts(files, {
        load: (file) => deps.files.bytes(file),
        ...(deps.extract ? { extract: deps.extract } : {}),
      });
      return {
        documents: texts.documents.map((document) => ({ ...document })),
        files: texts.reads.map((read) => ({ ...read })),
      };
    },
  };
}
