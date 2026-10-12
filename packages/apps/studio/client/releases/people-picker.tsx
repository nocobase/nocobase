/**
 * Release management keeps an environment's approvers as user ids; Studio picks them by name from the projects
 * plugin's members (`ReleasesPeoplePickerContext`, `../components/member-picker.tsx`).
 */
import {
  ReleasesPeoplePickerContext,
  type PeoplePickerProps,
} from '@nocobase/app-plugin-releases/client';
import type { ReactElement, ReactNode } from 'react';

import { MembersPicker } from '../components/member-picker.js';

function StudioPeoplePicker(props: PeoplePickerProps): ReactElement {
  return <MembersPicker {...props} />;
}

const picker = { Picker: StudioPeoplePicker };

export function ReleasePeoplePicker({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  return (
    <ReleasesPeoplePickerContext.Provider value={picker}>
      {children}
    </ReleasesPeoplePickerContext.Provider>
  );
}
