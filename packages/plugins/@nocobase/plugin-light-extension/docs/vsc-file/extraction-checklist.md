# VSC File extraction checklist

The internal dependency direction is fixed: Light Extension domain code may depend on the VSC internal module, and the VSC internal module may depend on core and RunJS. VSC code must not import Light Extension domain services, resources, or components.

Moving this directory to another package is not sufficient to extract VSC File. A future extraction must also:

- restore package-root server, client, and client-v2 entry points and lifecycle ownership;
- restore package-root collection and migration discovery without changing the existing `vscFile*` table names;
- restore package-root Swagger composition and API documentation loading;
- restore package-root `en-US` and `zh-CN` locale registration while preserving the existing namespace and provider keys;
- restore manifests, peer dependencies, build inputs, preset metadata, generated plugin maps, and lockfile entries;
- verify persisted IDs, hashes, refs, owner types, audit actions, `sourceRef.type: 'vsc-file'`, resources, ACL, and remote recovery behavior;
- rerun server, legacy client, client-v2, declaration build, package build, and upgrade compatibility checks.
