import type { IncomingMessage } from 'node:http';

export declare function getRsbuildAlias(): Record<string, string>;
export declare function getRsbuildBrowserAlias(): Record<string, string>;
export declare function createPortalProxyBypass(appPublicPath: string): (req: IncomingMessage) => true | undefined;
export declare function generatePlugins(): void;
export declare function generateV2Plugins(): void;
