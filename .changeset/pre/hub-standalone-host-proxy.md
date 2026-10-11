---
'@nocobase/app-server': minor
---

Add optional standalone HTTP and WebSocket proxy routing and configure Hub to forward paths outside its public mount to the current ready App Host port. Preserve public request identity and streaming, release proxy connections during shutdown, and use the shared public entry for hosted application links.

Return 502 and close the upstream connection when a regular HTTP request receives an unexpected protocol upgrade. Validate App IDs against the normalized Hub mount and the managed Host's reserved `__` namespace before creating an application.
