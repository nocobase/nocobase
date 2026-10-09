# NocoBase 3 workflow entry points

NocoBase 3 lives on `v3-develop` and `v3-main`. This repository keeps `main` as its default branch and keeps its existing v1/v2 workflows unchanged.

The workflows whose names begin with `V3` provide manual entry points on `main`. Their filenames use the `v3-` prefix on both `main` and the v3 branches and stay directly in `.github/workflows/`. Run one from `main` to dispatch its implementation from `v3-develop`; its inputs are forwarded unchanged in meaning. You can also select `v3-develop` directly to run that implementation. The dispatching run only confirms the request was accepted: inspect the resulting v3 run for the build or release outcome.

Beta releases use `v3-develop`. Stable releases select the `v3-main` source through the `branch` input. The stable branch initially contains the imported beta snapshot and cannot publish until the normal promotion workflow removes prerelease state. Creating these branches or merging the entry points does not publish any package.

The Pro workflows remain independent and operate on the Pro repository's own branches. Their credentials and framework references must be ready before using them. Documentation and UI Library publishing require `V3_ASSET_DEPLOY_ENABLED=true` after the v3 deployment configuration has been verified; build-only checks remain available.

Implementation files, scripts and application dependencies stay on the v3 branches. These entries need only the workflow token's Actions permission to dispatch the same workflow on `v3-develop`; they do not check out or execute v3 application code on `main`.
