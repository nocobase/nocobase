/**
 * Choosing people, such as an environment's approvers. The plugin stores user ids and has no directory of its own;
 * the assembling application knows its people, so it may provide `ReleasesPeoplePickerContext` with a picker that
 * shows them by name. Without it, ids are typed, separated by commas (`components/people-picker.tsx`).
 */
import { createContext, type ComponentType, type Context } from 'react';

export interface PeoplePickerProps {
  /** The chosen people's user ids. */
  readonly value: readonly string[];
  readonly onChange: (userIds: string[]) => void;
  readonly id?: string;
  readonly disabled?: boolean;
  readonly placeholder?: string;
}

export interface PeoplePicker {
  readonly Picker: ComponentType<PeoplePickerProps>;
}

export const ReleasesPeoplePickerContext: Context<PeoplePicker | null> =
  createContext<PeoplePicker | null>(null);
