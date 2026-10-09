import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mail = vi.hoisted(() => ({
  listTemplates: vi.fn(),
  saveTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
}));
vi.mock('../../client/runtime.js', () => ({ useMailClient: () => mail }));
import { MailTemplateManager } from '../../client/components/mail-template-manager.js';

describe('template management interactions', () => {
  const templates = [
    { id: 'z', name: 'Zebra', subject: 'Later', html: '<p>Rich body</p>' },
    { id: 'a', name: 'Alpha', subject: 'Welcome', text: 'Plain body' },
  ];

  beforeEach(() => {
    for (const mock of Object.values(mail)) mock.mockReset();
    mail.listTemplates.mockResolvedValue(templates);
    mail.saveTemplate.mockResolvedValue(templates[1]);
    mail.deleteTemplate.mockResolvedValue(undefined);
  });

  it('creates a template without a subject while still requiring a name', async () => {
    render(<MailTemplateManager />);
    await screen.findByRole('region', { name: 'Templates' });
    const submit = screen.getByRole('button', { name: 'Add template' });
    fireEvent.change(screen.getByLabelText('Template name'), {
      target: { value: '   ' },
    });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Template name'), {
      target: { value: 'Body only' },
    });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    await waitFor(() =>
      expect(mail.saveTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Body only', subject: '' }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Template name')).toHaveValue(''),
    );
  });

  it('sorts templates, restores plain text for editing, saves changes and resets the editor', async () => {
    render(<MailTemplateManager />);
    const list = within(
      await screen.findByRole('region', { name: 'Templates' }),
    );
    expect(
      list
        .getAllByRole('button', { name: /^(Alpha|Zebra)/ })
        .map((button) => button.textContent),
    ).toEqual(['AlphaWelcome', 'ZebraLater']);
    fireEvent.click(list.getByRole('button', { name: /^Alpha/ }));
    expect(list.getByRole('button', { name: /^Alpha/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByLabelText('Template name')).toHaveValue('Alpha');
    expect(
      screen.getByRole('textbox', { name: 'Message body' }),
    ).toHaveTextContent('Plain body');
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Updated subject' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save template' }));
    await waitFor(() =>
      expect(mail.saveTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'a',
          name: 'Alpha',
          subject: 'Updated subject',
          text: 'Plain body',
          html: '<p>Plain body</p>',
        }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Template name')).toHaveValue(''),
    );
    expect(mail.listTemplates).toHaveBeenCalledTimes(2);
  });

  it('keeps unsaved input after a save failure and prevents duplicate saves while pending', async () => {
    let rejectSave: ((reason: Error) => void) | undefined;
    mail.saveTemplate.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectSave = reject;
        }),
    );
    render(<MailTemplateManager />);
    await screen.findByRole('region', { name: 'Templates' });
    expect(screen.getByRole('button', { name: 'Add template' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Template name'), {
      target: { value: 'New' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'New subject' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add template' }));
    const pending = screen.getByRole('button', { name: 'Saving…' });
    expect(pending).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    fireEvent.click(pending);
    expect(mail.saveTemplate).toHaveBeenCalledTimes(1);
    rejectSave?.(new Error('Save unavailable'));
    expect(await screen.findByText('Save unavailable')).toBeVisible();
    expect(screen.getByLabelText('Template name')).toHaveValue('New');
    expect(screen.getByLabelText('Subject')).toHaveValue('New subject');
    fireEvent.click(screen.getByRole('button', { name: 'Add template' }));
    await waitFor(() => expect(mail.saveTemplate).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByLabelText('Subject')).toHaveValue(''),
    );
  });

  it('preserves the selected template after deletion fails and clears it after retry succeeds', async () => {
    mail.deleteTemplate.mockRejectedValueOnce(new Error('Delete unavailable'));
    render(<MailTemplateManager />);
    fireEvent.click(await screen.findByRole('button', { name: /^Zebra/ }));
    expect(
      screen.getByRole('textbox', { name: 'Message body' }),
    ).toHaveTextContent('Rich body');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Zebra' }));
    expect(mail.deleteTemplate).not.toHaveBeenCalled();
    const dialog = within(
      await screen.findByRole('dialog', { name: 'Delete template?' }),
    );
    expect(dialog.getByText('Zebra')).toBeVisible();
    fireEvent.click(dialog.getByRole('button', { name: 'Delete template' }));
    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'Delete unavailable',
    );
    expect(screen.getByLabelText('Template name')).toHaveValue('Zebra');
    mail.listTemplates.mockResolvedValue([templates[1]]);
    fireEvent.click(dialog.getByRole('button', { name: 'Delete template' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Template name')).toHaveValue(''),
    );
    expect(mail.deleteTemplate).toHaveBeenCalledWith('z');
    expect(
      screen.queryByRole('button', { name: /^Zebra/ }),
    ).not.toBeInTheDocument();
  });

  it('deletes an unselected template from the list without clearing the current draft', async () => {
    render(<MailTemplateManager />);
    fireEvent.click(await screen.findByRole('button', { name: /^Alpha/ }));
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Unsaved subject' },
    });
    mail.listTemplates.mockResolvedValue([templates[1]]);
    const list = within(screen.getByRole('region', { name: 'Templates' }));
    fireEvent.click(list.getByRole('button', { name: 'Delete Zebra' }));
    fireEvent.click(
      within(
        await screen.findByRole('dialog', { name: 'Delete template?' }),
      ).getByRole('button', { name: 'Delete template' }),
    );
    await waitFor(() =>
      expect(
        list.queryByRole('button', { name: 'Delete Zebra' }),
      ).not.toBeInTheDocument(),
    );
    expect(mail.deleteTemplate).toHaveBeenCalledWith('z');
    expect(screen.getByLabelText('Template name')).toHaveValue('Alpha');
    expect(screen.getByLabelText('Subject')).toHaveValue('Unsaved subject');
  });

  it('cancels deletion without losing edits and blocks repeat confirmation while deleting', async () => {
    let resolveDelete: (() => void) | undefined;
    mail.deleteTemplate.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
    );
    render(<MailTemplateManager />);
    fireEvent.click(await screen.findByRole('button', { name: /^Alpha/ }));
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Unsaved subject' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Delete Alpha' }));
    const firstDialog = within(
      await screen.findByRole('dialog', { name: 'Delete template?' }),
    );
    fireEvent.click(firstDialog.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(mail.deleteTemplate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Subject')).toHaveValue('Unsaved subject');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Alpha' }));
    const dialog = within(
      await screen.findByRole('dialog', { name: 'Delete template?' }),
    );
    fireEvent.click(dialog.getByRole('button', { name: 'Delete template' }));
    expect(dialog.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
    expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    fireEvent.click(dialog.getByRole('button', { name: 'Deleting…' }));
    expect(mail.deleteTemplate).toHaveBeenCalledTimes(1);
    mail.listTemplates.mockResolvedValue([templates[0]]);
    resolveDelete?.();
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Template name')).toHaveValue('');
  });

  it('cancels editing without persisting changes', async () => {
    render(<MailTemplateManager />);
    fireEvent.click(await screen.findByRole('button', { name: /^Alpha/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: /^Alpha/ })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByLabelText('Template name')).toHaveValue('');
    expect(mail.saveTemplate).not.toHaveBeenCalled();
    expect(mail.deleteTemplate).not.toHaveBeenCalled();
  });

  it('cancels a new template without saving it', async () => {
    render(<MailTemplateManager />);
    await screen.findByRole('region', { name: 'Templates' });
    fireEvent.change(screen.getByLabelText('Template name'), {
      target: { value: 'Unsaved template' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByLabelText('Template name')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Add template' })).toBeDisabled();
    expect(mail.saveTemplate).not.toHaveBeenCalled();
  });

  it('shows a failed initial request without inventing a template', async () => {
    mail.listTemplates.mockRejectedValueOnce(new Error('List unavailable'));
    render(<MailTemplateManager />);
    expect(await screen.findByText('List unavailable')).toBeVisible();
    expect(screen.getByText('No templates yet.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Add template' })).toBeDisabled();
  });
});
