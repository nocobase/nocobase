export interface ReviewTask {
  id: string;
  runId: string;
  quotationId: string;
  totalCents: number;
  route: 'standard' | 'manual-follow-up';
  status: 'pending' | 'submitting' | 'submitted' | 'unavailable';
  waitStatus: string;
  resumeRequestId: string | null;
  resumeRequest:
    | {
        status: 'executing' | 'queued' | 'processing' | 'consumed';
        reason: null;
      }
    | {
        status: 'rejected';
        reason: 'stale' | 'run-ended' | 'target-missing' | 'commit-failed';
      }
    | { status: 'not-found' }
    | null;
  confirmedBy: string | null;
  reviewerId: string | null;
  decision: 'approved' | 'rejected' | null;
  comment: string | null;
  createdAt: string;
  submittedAt: string | null;
}
