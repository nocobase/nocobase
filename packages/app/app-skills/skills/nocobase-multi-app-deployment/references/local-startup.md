# Configure Main and provide a child archive

## Configure Main

The commercial multi-app template creates Main only. Install dependencies, run `pnpm nocobase config init`, review its configuration and run `pnpm nocobase config check`. Configure the managed App Host explicitly before provisioning instances. Keep Main's configuration, storage and database separate from child instance state. Commercial packages require compatible versions and authorized registry access.

## Build the child

Develop and test a complete independent child application. In the child's project, run:

```bash
pnpm build --tar
```

The output is `storage/exports/dist.tar.gz`. Require the full build to succeed, including production dependency installation. Verify the archive's version, checksum and compatibility with the Host OS, CPU, libc and Node version. Keep instance secrets, databases and uploads outside the archive. Source directory names and placement are not part of the deployment contract.

## Publish and provision

Use Main's Templates management to create a template, upload the child's archive and publish its immutable version. Then create an instance from that version, supplying instance-specific configuration through supported management surfaces. Read the installed multi-app plugin Skill and authenticated API document when using an API rather than the UI; do not invent endpoints or write management tables directly.

Confirm the instance reaches its expected running state and check its actual entry, authorized operations, denied access and persistent data. Configure identity issuance in Main and Platform SSO in the child only when shared login is required; verify browser SSO separately with trusted HTTPS.

## Upgrade explicitly

Build a new child version and provide a new `dist.tar.gz`. Upload and publish that version, then select the instances to upgrade. Publication alone does not upgrade instances. Verify migration behavior, retained data and recovery before claiming the upgrade is usable.

Ordinary Main startup must not publish archives, create instances or upgrade them automatically. Resume from persisted management state; keep deliberately stopped instances stopped. Report the exact artifact/version, instance identifiers, completed checks and any pending acceptance evidence.
