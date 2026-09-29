import { useState, type ReactElement } from 'react';
import type { DateRange } from 'react-day-picker';

import {
  DatePicker,
  DateRangePicker,
} from '../../../registry/components/date-picker';

/** One frame per variant: the controlled field, an uncontrolled one, and the range. */
export function DatePickerDemo(): ReactElement {
  const [date, setDate] = useState<Date | undefined>();
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: new Date(2026, 8, 1),
    to: new Date(2026, 8, 30),
  }));

  return (
    <div className='min-h-svh space-y-6 bg-background p-6 text-foreground md:p-8'>
      <Variant>
        <DatePicker onChange={setDate} value={date} />
      </Variant>
      <Variant>
        <DatePicker defaultValue={new Date(2026, 8, 26)} />
      </Variant>
      <Variant>
        <DateRangePicker onChange={setRange} value={range} />
      </Variant>
    </div>
  );
}

function Variant({
  children,
}: {
  readonly children: ReactElement;
}): ReactElement {
  return <div className='rounded-lg border border-dashed p-4'>{children}</div>;
}
