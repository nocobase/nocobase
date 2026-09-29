import { enUS, zhCN } from 'date-fns/locale';
import { useState, type ReactElement } from 'react';

import { DateTimePicker } from '../../../registry/components/date-time-picker';

/** The same field under two locales, which change the trigger text and the calendar. */
export function DateTimePickerDemo(): ReactElement {
  const [chinese, setChinese] = useState<Date | undefined>(
    () => new Date(2026, 8, 26, 10, 0),
  );
  const [english, setEnglish] = useState<Date | undefined>(
    () => new Date(2026, 8, 26, 18, 30),
  );

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
