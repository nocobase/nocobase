import type {
  MailAccountView,
  MailClient,
  MailLabelColor,
  MailSaveTemplateInput,
} from '@nocobase/app-plugin-mail/client';

import { hasDemoSeed, markDemoSeeded } from './demo-seed.js';

const DEMO_TEMPLATES: readonly MailSaveTemplateInput[] = [
  {
    name: 'Project update',
    subject: 'Project update: {{project}}',
    text: 'Hi {{name}},\n\nHere is the latest update for {{project}}.\n\nBest,\nSam',
    html: '<p>Hi {{name}},</p><p>Here is the latest update for <strong>{{project}}</strong>.</p><p>Best,<br />Sam</p>',
  },
  {
    name: 'Meeting follow-up',
    subject: 'Thanks for meeting today',
    text: 'Hi {{name}},\n\nThanks for your time today. I will share the notes shortly.\n\nBest,\nSam',
    html: '<p>Hi {{name}},</p><p>Thanks for your time today. I will share the notes shortly.</p><p>Best,<br />Sam</p>',
  },
];

const DEMO_LABELS: readonly {
  readonly name: string;
  readonly color: MailLabelColor;
}[] = [
  { name: 'Follow up', color: 'blue' },
  { name: 'Project', color: 'violet' },
  { name: 'Reference', color: 'green' },
];

export async function seedDemoManagement(
  mail: MailClient,
  accounts: readonly MailAccountView[],
): Promise<void> {
  const ownerId = accounts[0]?.userId;
  if (!ownerId) return;

  await Promise.all([
    seedTemplates(mail, ownerId),
    seedSignatures(mail, accounts, ownerId),
    seedLabels(mail, ownerId),
  ]);
}

async function seedTemplates(mail: MailClient, ownerId: string): Promise<void> {
  if (hasDemoSeed('templates', ownerId)) return;
  const current = await mail.listTemplates();
  for (const sample of DEMO_TEMPLATES) {
    if (!current.some((template) => template.name === sample.name)) {
      await mail.saveTemplate(sample);
    }
  }
  markDemoSeeded('templates', ownerId);
}

async function seedSignatures(
  mail: MailClient,
  accounts: readonly MailAccountView[],
  ownerId: string,
): Promise<void> {
  if (hasDemoSeed('signatures', ownerId)) return;
  for (const account of accounts) {
    const current = await mail.listSignatures(account.id);
    if (current.some((signature) => signature.name === 'Demo signature')) {
      continue;
    }
    const senderName = account.displayName || account.address;
    await mail.saveSignature({
      accountId: account.id,
      name: 'Demo signature',
      text: `Best,\n${senderName}`,
      html: `<p>Best,<br />${escapeHtml(senderName)}</p>`,
      isDefault: true,
    });
  }
  markDemoSeeded('signatures', ownerId);
}

async function seedLabels(mail: MailClient, ownerId: string): Promise<void> {
  if (hasDemoSeed('labels', ownerId)) return;
  const current = await mail.listLabels();
  for (const sample of DEMO_LABELS) {
    if (!current.some((label) => label.name === sample.name)) {
      await mail.createLabel(sample.name, sample.color);
    }
  }
  markDemoSeeded('labels', ownerId);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character] ?? character;
  });
}
