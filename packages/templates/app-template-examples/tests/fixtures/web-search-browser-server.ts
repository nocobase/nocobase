import { startWebSearchTransport } from './web-search-transport.js';

await startWebSearchTransport();
await import('./online-agent-browser-server.js');
