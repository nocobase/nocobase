import { enUS, zhCN } from 'date-fns/locale';
import { useState, type ReactElement } from 'react';

import {
  DateTimePicker,
  type DateTimeRange,
} from '../../../registry/components/date-time-picker';

/** The single field under two locales, and the range mode's start and end times. */
export function DateTimePickerDemo(): ReactElement {
  const [chinese, setChinese] = useState<Date | undefined>(
    () => new Date(2026, 8, 26, 10, 0),
  );
  const [english, setEnglish] = useState<Date | undefined>(
    () => new Date(2026, 8, 26, 18, 30),
  );
  const [window, setWindow] = useState<DateTimeRange | undefined>(() => ({
    start: new Date(2026, 8, 12, 10, 30),
    end: new Date(2026, 8, 12, 12, 30),
  }));

  return (
    <div className='min-h-svh space-y-6 bg-background p-6 text-foreground md:p-8'>
      <Variant>
        <DateTimePicker
          id='demo-publish-at'
          locale={zhCN}
          onChange={setChinese}
          value={chinese}
        />
      </Variant>
      <Variant>
        <DateTimePicker locale={enUS} onChange={setEnglish} value={english} />
      </Variant>
      <Variant>
        <DateTimePicker
          mode='range'
          locale={zhCN}
          onChange={setWindow}
          value={window}
        />
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
