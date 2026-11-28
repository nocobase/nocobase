# Measuring run usage reports

Measure `reporting.usage` on the same isolated PostgreSQL database before and after the change. Apply the Agents migrations, seed runs and usage, and run `ANALYZE` on both tables. Drop the new usage date index for the baseline and restore it for the new service. Keep the baseline and new service on the same Node.js process, driver, database and fixture. Time each complete service call, including database round trips, row decoding, prices, report formatting and agent names. Count statements through the database client's query event. Warm each service once, take five sequential samples and compare the median. Compare the full report objects.

Use an all-runs reader and the default 30 UTC days, grouped by agent with `series: true`. The measured fixtures used 14 agent keys and 14 coding-tool/model combinations, a mixture of priced and unpriced usage, and one percent extra usage records linked to existing runs in the selected range. The two fixtures yielded 36,643 and 36,096 distinct runs in range, respectively. Run summaries had 2,000 characters of synthetic text. PostgreSQL 16.15 ran on the same Linux machine over the loopback interface.

| Usage rows / days | Rows in 30 days | Baseline median | SQL median | Speedup | Statements |
| ----------------- | --------------: | --------------: | ---------: | ------: | ---------: |
| 50,000 / 51       |          37,143 |        875.9 ms |   106.3 ms |   8.24× |     78 → 5 |
| 500,000 / 365     |          41,096 |        947.5 ms |   184.8 ms |   5.13× |     77 → 5 |

Both comparisons returned equal report objects. These service timings include no HTTP transport, authentication or host-defined subject lookup. Typical work includes two usage statements for the series view, two price reads and one agent-name read. Separate daily or overlap totals and host subject policies can add reads. The report adds no writes, explicit locks or transactions. The group picker issues a distinct-subject read and resolves visible groups through the host; it skips the database when no subject kind provides report groups.
