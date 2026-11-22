import type { MailStatusTone } from '../components/mail-status-badge.js';

export function syncRunTone(status: string): MailStatusTone {
  switch (status) {
    case 'completed':
      return 'success';
    case 'partial':
      return 'warning';
    case 'failed':
      return 'danger';
    case 'pending':
    case 'running':
      return 'info';
    default:
      return 'neutral';
  }
}

export function submissionTone(status: string): MailStatusTone {
  switch (status) {
    case 'accepted':
      return 'success';
    case 'failed':
      return 'danger';
    case 'unknown':
      return 'warning';
    case 'pending':
    case 'submitting':
      return 'info';
    default:
      return 'neutral';
  }
}
