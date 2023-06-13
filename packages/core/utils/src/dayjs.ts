import dayjs from 'dayjs';
import IsBetween from 'dayjs/plugin/isBetween';
import IsSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isoWeek from 'dayjs/plugin/isoWeek';
import localeData from 'dayjs/plugin/localeData';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import utc from 'dayjs/plugin/utc';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(utc);
dayjs.extend(quarterOfYear);
dayjs.extend(isoWeek);
dayjs.extend(IsBetween);
dayjs.extend(IsSameOrAfter);

export default dayjs;
