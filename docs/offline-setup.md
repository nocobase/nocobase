# Offline Setup

This repository provides helper scripts for working behind firewalls or setting up a local package mirror.

## Configure Network

Run `scripts/setup_network.sh` before installing dependencies. The script optionally replaces `apt` mirrors when a `sources.list` file exists in the project root and configures the npm/yarn registry using the `VERDACCIO_URL` environment variable or `NPM_REGISTRY_URL`.

```bash
bash scripts/setup_network.sh
```

## Prepare NPM Packages

Use `scripts/generate_tarball_list.js` to collect all package dependencies and write them to `storage/tarball-list.txt`.

```bash
node scripts/generate_tarball_list.js
```

Each line of `storage/tarball-list.txt` contains a package and version. Run `npm pack` for every entry to download tarballs that can be used for offline installation.

