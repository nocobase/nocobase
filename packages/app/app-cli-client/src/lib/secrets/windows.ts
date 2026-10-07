// The Windows Credential Manager through Windows PowerShell, which compiles a few lines of C# calling `CredReadW`,
// `CredWriteW` and `CredDeleteW` (advapi32) when it runs: no native module to ship. The script goes in
// `-EncodedCommand`; the request, the secret among it, goes on standard input as JSON, base64 where it is binary.
import { existsSync } from 'node:fs';
import path from 'node:path';

import {
  runTool,
  SecretStoreError,
  toolError,
  type RunTool,
  type SecretStore,
} from './store.ts';

/** How the script exits when there is no such credential. */
const NOT_FOUND = 44;

const SCRIPT = String.raw`$ErrorActionPreference = 'Stop'
if (-not ('AppCli.Credentials' -as [type])) {
Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
namespace AppCli {
  public static class Credentials {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    struct CREDENTIAL {
      public uint Flags; public uint Type; public string TargetName; public string Comment;
      public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
      public uint CredentialBlobSize; public IntPtr CredentialBlob; public uint Persist;
      public uint AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
    }
    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool CredRead(string target, uint type, uint flags, out IntPtr credential);
    [DllImport("advapi32.dll", EntryPoint = "CredWriteW", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool CredWrite(ref CREDENTIAL credential, uint flags);
    [DllImport("advapi32.dll", EntryPoint = "CredDeleteW", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool CredDelete(string target, uint type, uint flags);
    [DllImport("advapi32.dll")]
    static extern void CredFree(IntPtr buffer);
    const int ERROR_NOT_FOUND = 1168;
    const uint CRED_TYPE_GENERIC = 1;
    const uint CRED_PERSIST_LOCAL_MACHINE = 2;
    public static byte[] Read(string target) {
      IntPtr pointer;
      if (!CredRead(target, CRED_TYPE_GENERIC, 0, out pointer)) {
        int error = Marshal.GetLastWin32Error();
        if (error == ERROR_NOT_FOUND) return null;
        throw new Win32Exception(error);
      }
      try {
        CREDENTIAL credential = (CREDENTIAL)Marshal.PtrToStructure(pointer, typeof(CREDENTIAL));
        byte[] bytes = new byte[credential.CredentialBlobSize];
        if (bytes.Length > 0) Marshal.Copy(credential.CredentialBlob, bytes, 0, bytes.Length);
        return bytes;
      } finally { CredFree(pointer); }
    }
    public static void Write(string target, string user, string comment, byte[] secret) {
      CREDENTIAL credential = new CREDENTIAL();
      credential.Type = CRED_TYPE_GENERIC; credential.TargetName = target; credential.UserName = user;
      credential.Comment = comment; credential.Persist = CRED_PERSIST_LOCAL_MACHINE;
      credential.CredentialBlobSize = (uint)secret.Length;
      credential.CredentialBlob = Marshal.AllocHGlobal(secret.Length);
      try {
        Marshal.Copy(secret, 0, credential.CredentialBlob, secret.Length);
        if (!CredWrite(ref credential, 0)) throw new Win32Exception(Marshal.GetLastWin32Error());
      } finally { Marshal.FreeHGlobal(credential.CredentialBlob); }
    }
    public static void Delete(string target) {
      if (!CredDelete(target, CRED_TYPE_GENERIC, 0)) {
        int error = Marshal.GetLastWin32Error();
        if (error != ERROR_NOT_FOUND) throw new Win32Exception(error);
      }
    }
  }
}
'@
}
try {
  $request = [Console]::In.ReadToEnd() | ConvertFrom-Json
  switch ($request.op) {
    'get' {
      $bytes = [AppCli.Credentials]::Read($request.target)
      if ($null -eq $bytes) { exit ${NOT_FOUND} }
      [Console]::Out.Write([Convert]::ToBase64String($bytes))
    }
    'set' { [AppCli.Credentials]::Write($request.target, $request.account, $request.label, [Convert]::FromBase64String($request.secret)) }
    'delete' { [AppCli.Credentials]::Delete($request.target) }
  }
} catch {
  [Console]::Error.WriteLine($_.Exception.Message)
  exit 1
}
exit 0
`;

/** Windows PowerShell by its absolute path, so nothing on PATH stands in for it. */
export function windowsPowerShell(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return path.join(
    env.SystemRoot ?? 'C:\\Windows',
    'System32',
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe',
  );
}

/** The arguments PowerShell runs the script with. */
export const POWERSHELL_ARGS: readonly string[] = [
  '-NoProfile',
  '-NonInteractive',
  '-ExecutionPolicy',
  'Bypass',
  '-EncodedCommand',
  Buffer.from(SCRIPT, 'utf16le').toString('base64'),
];

/** The credential's target name: one generic credential per service and account. */
export function credentialTarget(service: string, account: string): string {
  return `${service}:${account}`;
}

interface Request {
  op: 'probe' | 'get' | 'set' | 'delete';
  target: string;
  account?: string;
  label?: string;
  secret?: string;
}

export class CredentialManager implements SecretStore {
  readonly kind = 'credential-manager' as const;

  private readonly run: RunTool;
  private readonly powershell: string;
  private readonly platform: NodeJS.Platform;

  constructor(
    run: RunTool = runTool,
    powershell: string = windowsPowerShell(),
    platform: NodeJS.Platform = process.platform,
  ) {
    this.run = run;
    this.powershell = powershell;
    this.platform = platform;
  }

  async available(): Promise<boolean> {
    if (this.platform !== 'win32' || !existsSync(this.powershell)) return false;
    // Compiling the helper is what fails where scripts or Add-Type are locked down.
    return (await this.call({ op: 'probe', target: '' })).code === 0;
  }

  async get(service: string, account: string): Promise<string | undefined> {
    const result = await this.call({
      op: 'get',
      target: credentialTarget(service, account),
    });
    if (result.code === NOT_FOUND) return undefined;
    if (result.code !== 0)
      throw new SecretStoreError(
        `Cannot read the Windows Credential Manager: ${toolError(result)}`,
      );
    const value = Buffer.from(result.stdout.trim(), 'base64').toString('utf8');
    return value === '' ? undefined : value;
  }

  async set(
    service: string,
    account: string,
    secret: string,
    label: string,
  ): Promise<void> {
    const result = await this.call({
      op: 'set',
      target: credentialTarget(service, account),
      account,
      label,
      secret: Buffer.from(secret, 'utf8').toString('base64'),
    });
    if (result.code !== 0 || (await this.get(service, account)) !== secret)
      throw new SecretStoreError(
        `Cannot write to the Windows Credential Manager: ${result.stderr.trim() || 'the credential did not stick'}`,
      );
  }

  async delete(service: string, account: string): Promise<void> {
    const result = await this.call({
      op: 'delete',
      target: credentialTarget(service, account),
    });
    if (result.code !== 0)
      throw new SecretStoreError(
        `Cannot delete from the Windows Credential Manager: ${toolError(result)}`,
      );
  }

  private call(request: Request) {
    return this.run(this.powershell, POWERSHELL_ARGS, JSON.stringify(request));
  }
}
