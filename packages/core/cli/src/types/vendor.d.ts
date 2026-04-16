declare module 'picocolors' {
  const pc: {
    bold(value: string): string;
    cyan(value: string): string;
    dim(value: string): string;
    green(value: string): string;
    yellow(value: string): string;
    red(value: string): string;
  };

  export default pc;
}

declare module 'ora' {
  export interface Ora {
    text: string;
    start(): Ora;
    stop(): Ora;
    succeed(text?: string): Ora;
    fail(text?: string): Ora;
    warn(text?: string): Ora;
    info(text?: string): Ora;
  }

  export interface OraOptions {
    text?: string;
    isSilent?: boolean;
  }

  export default function ora(options?: OraOptions): Ora;
}
