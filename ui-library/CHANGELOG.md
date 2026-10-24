# UI Library changes

## Unreleased

- Keep flow diagram viewport controls disabled until React Flow initializes the viewport, so the first zoom or fit action is not lost. This is a hosted registry source change; existing applications retain their installed component until they update it.

The UI Library is a private workspace and publishes its source registry through `.github/workflows/v3-ui-library.yml`, rather than npm package versioning. Registry changes are documented here; package changesets apply to publishable packages under `packages/`.
