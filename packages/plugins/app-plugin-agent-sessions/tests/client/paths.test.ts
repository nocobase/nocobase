import { describe, expect, it } from 'vitest';

import { installedAgents, otherAgentNames } from '../../client/lib/agents.js';
import {
  displayPath,
  isWithin,
  joinPath,
  parentOf,
  separatorOf,
} from '../../client/lib/paths.js';

describe('a computer’s paths', () => {
  it('writes the home directory as ~, on Windows ignoring case', () => {
    expect(displayPath('/home/me/code', '/home/me')).toBe('~/code');
    expect(displayPath('/home/me', '/home/me')).toBe('~');
    expect(displayPath('/home/meow', '/home/me')).toBe('/home/meow');
    expect(displayPath('c:\\users\\me\\Code', 'C:\\Users\\Me')).toBe('~\\Code');
    expect(displayPath('C:\\Users\\Me', 'C:\\Users\\Me')).toBe('~');
    expect(displayPath('/srv', null)).toBe('/srv');
  });

  it('tells whether a path is under one of the roots', () => {
    expect(isWithin(['/home/me'], '/home/me/code')).toBe(true);
    expect(isWithin(['/'], '/home')).toBe(true);
    expect(isWithin(['C:\\'], 'C:\\Users')).toBe(true);
    expect(isWithin(['/home/me'], '/home/meow')).toBe(false);
    expect(isWithin(['C:\\Users\\Me'], 'c:\\users\\me\\code')).toBe(true);
    expect(isWithin(['C:\\Users\\Me'], 'D:\\Users\\Me')).toBe(false);
  });

  it('joins and climbs with the separator its system writes', () => {
    expect(separatorOf('C:\\Users')).toBe('\\');
    expect(separatorOf('\\\\server\\share')).toBe('\\');
    expect(separatorOf('/home')).toBe('/');
    expect(joinPath('/home/me', 'code')).toBe('/home/me/code');
    expect(joinPath('/', 'home')).toBe('/home');
    expect(joinPath('C:\\Users', 'Me')).toBe('C:\\Users\\Me');
    expect(joinPath('C:\\', 'Users')).toBe('C:\\Users');
    expect(parentOf('/home/me/code')).toBe('/home/me');
    expect(parentOf('/home/me/')).toBe('/home');
    expect(parentOf('/home')).toBe('/');
    expect(parentOf('/')).toBeUndefined();
    expect(parentOf('C:\\Users\\Me')).toBe('C:\\Users');
    expect(parentOf('C:\\Users')).toBe('C:\\');
    expect(parentOf('C:\\')).toBeUndefined();
  });
});

describe('a computer’s agents', () => {
  const computer = {
    agents: [
      { id: 'codex', name: 'Codex', version: '2.2.2' },
      { id: 'gemini', name: 'Gemini CLI', version: null, problem: 'failed' },
      { id: 'cline', name: 'Cline', version: null, problem: 'notInstalled' },
      { id: 'amp', name: 'Amp', version: null, problem: 'notInstalled' },
    ] as const,
  };

  it('lists the installed ones, ready or not', () => {
    expect(installedAgents(computer).map((agent) => agent.id)).toEqual([
      'codex',
      'gemini',
    ]);
  });

  it('names the others in the reader’s language', () => {
    expect(otherAgentNames(computer, 'zh-CN')).toBe('Cline、Amp');
    expect(otherAgentNames(computer, 'en-US')).toBe('Cline, Amp');
    expect(
      otherAgentNames({ agents: computer.agents.slice(0, 2) }, 'en-US'),
    ).toBe('');
  });
});
