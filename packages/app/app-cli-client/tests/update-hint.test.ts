// The application's update hint: asked as the person, printed once per process, silent when it fails.
import { describe, expect, it } from 'vitest';

import { configureAppCli } from '../src/config.ts';
import { askUpdateHint, printUpdateHint } from '../src/lib/update-hint.ts';

describe('update hint', () => {
  it('prints what the application answers once, and nothing when it fails', async () => {
    const asked: string[] = [];
    configureAppCli({
      bin: 'acme',
      displayName: 'Acme',
      stateDir: '.acme',
      runCredentialsFile: '.acme/run.json',
      updateHint: (session) => {
        asked.push(session.server);
        return session.server.includes('broken')
          ? Promise.reject(new Error('offline'))
          : Promise.resolve('A newer acme is available.');
      },
    });
    const lines: string[] = [];
    const write = (line: string) => lines.push(line);
    await printUpdateHint(
      askUpdateHint({ server: 'https://broken.example.com', headers: {} }),
      write,
    );
    expect(lines).toEqual([]);
    await printUpdateHint(
      askUpdateHint({ server: 'https://acme.example.com', headers: {} }),
      write,
    );
    await printUpdateHint(
      askUpdateHint({ server: 'https://acme.example.com', headers: {} }),
      write,
    );
    expect(lines).toEqual(['A newer acme is available.']);
    expect(asked).toEqual([
      'https://broken.example.com',
      'https://acme.example.com',
    ]);
  });
});
