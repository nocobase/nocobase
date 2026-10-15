---
'@nocobase/studio': patch
---

Wake project managers once when delegated worker runs end, combine automatic reports with durable terminal notifications, and recover inactive manager work with a configurable structured periodic check using existing run and activity facts. Track exact PR check conclusions and actual delivery per issue so later results at the same head wake the manager again. Ignore check responses for heads that moved or pull requests that closed while the checks were being read. Avoid write transactions for ineligible or unchanged idle scans and settled CI signal retries; revalidate actual candidates under their existing locks. Preserve issue run push refreshes and personal runner consent when consuming terminal manager continuations.

Include the committed pull request id in checks-only refresh notifications so Git updates reach only the affected issue pages.

Check idle issues for newer inputs through their runs and the existing run/time index instead of scanning unrelated run inputs.
