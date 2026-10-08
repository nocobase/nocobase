import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export async function selectOption(
  trigger: HTMLElement,
  label: string,
): Promise<void> {
  // A user's press, not a bare click event: it lets React finish wiring a trigger that has just appeared.
  await userEvent.click(trigger);
  const option = await screen.findByRole('option', {
    name: label,
    exact: true,
  });
  fireEvent.pointerDown(option);
  fireEvent.click(option);
}
