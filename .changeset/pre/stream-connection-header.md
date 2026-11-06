---
'@nocobase/app-server': patch
---

Leave a response's `connection` and `keep-alive` headers to Node's HTTP server. The AI SDK's message streams say `connection: keep-alive` themselves, so a stream answering a request that asked to close its connection still announced keep-alive while Node closed it; a client reusing that connection had its next request refused with a bare 400 that never reached the application.
