# DateTime Field Types

DateTime field types can be categorized as follows:

- **DateTime (with Time Zone)** – These values are standardized to UTC (Coordinated Universal Time) and are adjusted for time zones when necessary.
- **DateTime (without Time Zone)** – Stores date and time values without including time zone information.
- **Date (without Time)** – Stores only the date, without time information.
- **Time** – Stores only the time, without date information.
- **Unix Timestamp** – Stores the number of seconds elapsed since January 1, 1970 (UTC).

### Examples of DateTime-Related Field Types

| **Field Type**               | **Example Value**            | **Description**                                       |
|------------------------------|------------------------------|-------------------------------------------------------|
| DateTime (with Time Zone)     | 2024-08-24T07:30:00.000Z     | Converted to UTC and can be adjusted for time zones    |
| DateTime (without Time Zone)  | 2024-08-24 15:30:00          | Stores date and time without time zone considerations  |
| Date (without Time)           | 2024-08-24                   | Captures only the date, with no time information       |
| Time                          | 15:30:00                     | Captures only the time, excluding any date details     |
| Unix Timestamp                | 1724437800                   | Represents seconds since 1970-01-01 00:00:00 UTC       |

## Data Source Comparisons

Comparison of DateTime field types across NocoBase, MySQL, and PostgreSQL:

| **Field Type**                | **NocoBase**               | **MySQL**                  | **PostgreSQL**                         |
|-------------------------------|----------------------------|----------------------------|----------------------------------------|
| DateTime (with Time Zone)      | Datetime with timezone     | TIMESTAMP<br/> DATETIME    | TIMESTAMP WITH TIME ZONE               |
| DateTime (without Time Zone)   | Datetime without timezone  | DATETIME                   | TIMESTAMP WITHOUT TIME ZONE            |
| Date (without Time)            | Date                       | DATE                       | DATE                                   |
| Time                           | Time                       | TIME                       | TIME WITHOUT TIME ZONE                 |
| Unix Timestamp                 | Unix timestamp             | INTEGER<br/>BIGINT         | INTEGER<br/>BIGINT                     |
| Time (with Time Zone)          | -                          | -                          | TIME WITH TIME ZONE                    |

**Note:**  
MySQL’s `TIMESTAMP` range is from `1970-01-01 00:00:01 UTC` to `2038-01-19 03:14:07 UTC`. For values outside this range, use `DATETIME` or `BIGINT` for storing Unix timestamps.

## DateTime Storage Process

### With Time Zone

Includes `DateTime (with Time Zone)` and `Unix Timestamp`.

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

**Notes:**  
- To support a wider date range, NocoBase uses the `DATETIME` type in MySQL for “DateTime (with Time Zone)” fields. The stored value is converted according to the server’s `TZ` environment variable. If this variable changes, the stored date values will also change.  
- Because UTC and local time differ by time zones, showing raw UTC values can be confusing to users.

### Without Time Zone


![20240824185600](https://static-docs.nocobase.com/20240824185600.png)


## UTC

UTC (Coordinated Universal Time) is the global standard for timekeeping. It is based on atomic clocks for high precision and is synchronized with the Earth’s rotation.

The difference between UTC and local time can cause confusion when displaying raw UTC values. For example:

| **Time Zone**   | **DateTime**                    |
|-----------------|---------------------------------|
| UTC             | 2024-08-24T07:30:00.000Z        |
| UTC+8           | 2024-08-24 15:30:00             |
| UTC+5           | 2024-08-24 12:30:00             |
| UTC-5           | 2024-08-24 02:30:00             |
| UTC+0           | 2024-08-24 07:30:00             |
| UTC-6           | 2024-08-23 01:30:00             |

All these values represent the same moment in time, just expressed in different time zones.