# DateTime Field Types

DateTime field types can be categorized as follows:

- **DateTime (with Time Zone):** These values are standardized to UTC (Coordinated Universal Time) and are subject to time zone adjustments when necessary.
- **DateTime (without Time Zone):** This type stores date and time data without incorporating any time zone information.
- **Date (without Time):** This format exclusively stores date information, omitting any time component.
- **Time:** Stores only time information, excluding the date.
- **Unix Timestamp:** This type represents the number of seconds that have elapsed since January 1, 1970, and is stored as a Unix timestamp.

Here are examples for each DateTime-related field type:

| **Field Type**               | **Example Value**            | **Description**                                       |
|------------------------------|------------------------------|-------------------------------------------------------|
| DateTime (with Time Zone)     | 2024-08-24T07:30:00.000Z     | Converted to UTC and can be adjusted for time zones    |
| DateTime (without Time Zone)  | 2024-08-24 15:30:00          | Stores date and time without time zone considerations  |
| Date (without Time)           | 2024-08-24                   | Captures only the date, with no time information       |
| Time                          | 15:30:00                     | Captures only the time, excluding any date details     |
| Unix Timestamp                | 1724437800                   | Represents seconds since 1970-01-01 00:00:00 UTC       |

## Data Source Comparisons

Below is a comparison table for NocoBase, MySQL, and PostgreSQL:

| **Field Type**                | **NocoBase**               | **MySQL**                  | **PostgreSQL**                         |
|-------------------------------|----------------------------|----------------------------|----------------------------------------|
| DateTime (with Time Zone)      | Datetime with timezone     | TIMESTAMP<br/> DATETIME    | TIMESTAMP WITH TIME ZONE               |
| DateTime (without Time Zone)   | Datetime without timezone  | DATETIME                   | TIMESTAMP WITHOUT TIME ZONE            |
| Date (without Time)            | Date                       | DATE                       | DATE                                   |
| Time                           | Time                       | TIME                       | TIME WITHOUT TIME ZONE                 |
| Unix Timestamp                 | Unix timestamp             | INTEGER<br/>BIGINT         | INTEGER<br/>BIGINT                     |
| Time (with Time Zone)          | -                          | -                          | TIME WITH TIME ZONE                    |

**Note:**
- MySQL’s TIMESTAMP type covers a range between `1970-01-01 00:00:01 UTC` and `2038-01-19 03:14:07 UTC`. For dates and times outside this range, it is recommended to use DATETIME or BIGINT to store Unix timestamps.

## DateTime Storage Processing Workflow

### With Time Zone

This includes `DateTime (without Time Zone)` and `Unix Timestamp`.

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

**Note:**
- To accommodate a broader range of dates, NocoBase uses the DATETIME type in MySQL for DateTime (with Time Zone) fields. The date value stored is converted based on the server's TZ environment variable, meaning that if the TZ environment variable changes, the stored DateTime value will also change.
- Since there is a time zone difference between UTC and local time, directly displaying the raw UTC value could lead to user confusion.

### Without Time Zone

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Coordinated Universal Time) is the global time standard used to coordinate and synchronize time worldwide. It is a highly precise time standard, maintained by atomic clocks, and synchronized with the Earth's rotation.

The difference between UTC and local time can cause confusion when displaying raw UTC values. For example:

| **Time Zone**   | **DateTime**                    |
|-----------------|---------------------------------|
| UTC             | 2024-08-24T07:30:00.000Z        |
| UTC+8           | 2024-08-24 15:30:00             |
| UTC+5           | 2024-08-24 12:30:00             |
| UTC-5           | 2024-08-24 02:30:00             |
| UTC+0           | 2024-08-24 07:30:00             |
| UTC-6           | 2024-08-23 01:30:00             |

These different times all correspond to the same moment, merely expressed in various time zones.
