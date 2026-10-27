# External calls and background work

Read this when the application has outbound integrations, file storage or background work. The database write guard does not isolate these effects. Inspect the integrations reachable from enabled demo features and from jobs that run automatically in this deployment.

## External effects

At each application-owned transport or service boundary, use the server-side Demo Mode flag to choose a local fixture or refuse the operation before it causes an external effect. Apply this to visitor-created records and queued work as well as generated fixtures.

Reuse existing adapters and business parsing/validation. Fixtures should return the shape each caller expects. Missing or disabled simulations must not fall through to real mail, notifications, payments, publishing or other outbound services. For models, tools and Runners, follow [simulation](simulation.md).

Use the demo deployment's own file storage and include generated and visitor-uploaded files in business cleanup. Keep private credentials and production storage out of the fixtures.

## Background work

Treat jobs, queue handlers and schedule firings as outside the write guard, including work a visitor's request enqueued. With in-process adapters, work that starts before that request ends may still be refused; do not rely on the guard to stop background writes. The same applies to streamed responses and WebSocket messages, which continue after their route handler returns: adapt their tool calls and writes as visitor-triggered work. For each enabled application job, choose whether it should run against fixtures or be disabled in the demo. Coordinate active work with generation and cleanup so a job cannot recreate deleted records or overwrite the new dataset. Preserve cancellation and duplicate-delivery protections.

Use the plugin's built-in daily reset; do not add a second reset timer or cron. Application-specific jobs still need their own demo adaptation.

## Verify the adapted boundaries

Exercise the demo interactions that reach these integrations and confirm their expected local results. Check that missing fixtures and disabled adapters refuse execution without reaching real providers. For queued work, verify cancellation and policy changes at execution time. Include the associated files, jobs and caches when checking cleanup.
