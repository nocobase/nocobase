import { Job, type JobClass, type JobExecutionContext } from '@nocobase/jobs';
import { z } from 'zod';
import { revisionOf } from './vector.js';

const generationPayload = z
  .object({ version: z.literal(1), generationId: z.string().min(1).max(64) })
  .strict();
const documentPayload = generationPayload
  .extend({
    docId: z.string().min(1).max(64),
    sourceRevision: z.string().refine((v) => {
      try {
        return revisionOf(v) === v;
      } catch {
        return false;
      }
    }),
  })
  .strict();
export interface GenerationPayload {
  readonly version: 1;
  readonly generationId: string;
}
export interface DocumentPayload extends GenerationPayload {
  readonly docId: string;
  readonly sourceRevision: string;
}
export interface IndexingHandlers {
  document(
    payload: DocumentPayload,
    context: JobExecutionContext,
  ): Promise<void>;
  generation(
    payload: GenerationPayload,
    context: JobExecutionContext,
  ): Promise<void>;
  dropTarget(
    payload: GenerationPayload,
    context: JobExecutionContext,
  ): Promise<void>;
}
export interface IndexingJobs {
  readonly Document: JobClass<DocumentPayload>;
  readonly Generation: JobClass<GenerationPayload>;
  readonly DropTarget: JobClass<GenerationPayload>;
}
/** A fresh class set per application; every consumer registers it before setup. */
export function createIndexingJobs(handlers: IndexingHandlers): IndexingJobs {
  class DocumentJob extends Job<DocumentPayload> {
    public static readonly jobName: string = 'knowledge.indexing.document';
    public async execute(context: JobExecutionContext): Promise<void> {
      await handlers.document(documentPayload.parse(this.payload), context);
    }
  }
  class GenerationJob extends Job<GenerationPayload> {
    public static readonly jobName: string = 'knowledge.indexing.generation';
    public async execute(context: JobExecutionContext): Promise<void> {
      await handlers.generation(generationPayload.parse(this.payload), context);
    }
  }
  class DropTargetJob extends Job<GenerationPayload> {
    public static readonly jobName: string = 'knowledge.indexing.dropTarget';
    public async execute(context: JobExecutionContext): Promise<void> {
      await handlers.dropTarget(generationPayload.parse(this.payload), context);
    }
  }
  return {
    Document: DocumentJob,
    Generation: GenerationJob,
    DropTarget: DropTargetJob,
  };
}
