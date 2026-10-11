import { describe, expect, it } from 'vitest';

import {
  confirmedRepositoryUrl,
  repositoryIdentity,
} from '../../server/git/repository-identity.js';

describe('confirmed repository identity', () => {
  it('derives public and enterprise identities from the trusted API endpoint', () => {
    expect(confirmedRepositoryUrl('https://api.github.com', 'acme/app')).toBe(
      'https://github.com/acme/app.git',
    );
    expect(
      confirmedRepositoryUrl('https://git.example/api/v3', 'acme/app'),
    ).toBe('https://git.example/acme/app.git');
    expect(
      confirmedRepositoryUrl('https://git.example:8443/api/v3/', 'acme/app'),
    ).toBe('https://git.example:8443/acme/app.git');
    expect(
      confirmedRepositoryUrl('https://git.example/unknown', 'acme/app'),
    ).toBeNull();
    expect(
      confirmedRepositoryUrl('http://git.example/api/v3', 'acme/app'),
    ).toBeNull();
  });

  it('preserves host, repository and nondefault HTTPS port boundaries', () => {
    const identity = repositoryIdentity('https://github.com/acme/app.git');
    for (const url of [
      'git@github.com:acme/app.git',
      'ssh://git@github.com:22/acme/app.git',
      'https://github.com/ACME/APP',
    ]) {
      expect(repositoryIdentity(url)).toBe(identity);
    }
    for (const url of [
      'https://other.example/acme/app.git',
      'https://github.com/acme/other.git',
      'https://github.com:8443/acme/app.git',
    ]) {
      expect(repositoryIdentity(url)).not.toBe(identity);
    }
    for (const url of [
      'ssh://git@github.com:2222/acme/app.git',
      'https://github.com/acme/app.git?ref=main',
      'file:///acme/app',
      'https://user@github.com/acme/app.git',
    ]) {
      expect(repositoryIdentity(url)).toBeNull();
    }
  });
});
