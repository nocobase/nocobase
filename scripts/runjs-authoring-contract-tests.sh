#!/usr/bin/env bash

set -euo pipefail

yarn test:server packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/move-source.integration.test.ts --run
yarn test:server packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/move-source.unit.test.ts --run
yarn test:server packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/repo-service.test.ts --run
yarn test:server packages/core/runjs-workspace/src/server/__tests__ --run
yarn test:server packages/plugins/@nocobase/plugin-flow-engine/src/server/__tests__/runjs-sources.unit.test.ts --run
yarn test:server packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/raw-resource-bypass.test.ts --run
yarn test:server packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/plugin-bootstrap.test.ts --run
yarn test:server packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/authoring-capabilities.test.ts --run
yarn test:server packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/swagger.test.ts --run
yarn test:server packages/plugins/@nocobase/plugin-flow-engine/src/server/__tests__/flow-surfaces.js-page-contract.test.ts --run
yarn test:server packages/plugins/@nocobase/plugin-flow-engine/src/server/__tests__/flow-surfaces.runjs-workspace-hosts.test.ts --run
yarn test:server packages/plugins/@nocobase/plugin-flow-engine/src/server/__tests__/flow-surfaces.swagger.test.ts --run
yarn test:server packages/presets/nocobase/src/server/__tests__/lightExtensionPreset.test.ts --run
yarn test:server packages/presets/nocobase/src/server/__tests__/lightExtensionPreset.runtime.test.ts --run

yarn test packages/core/runjs-workspace/src/swagger/__tests__/swagger.test.ts --run
yarn test:client packages/core/runjs-workspace/src/client-v2/__tests__ --run
yarn test:client packages/core/runjs-workspace/src/client/__tests__ --run
yarn test:client packages/core/client-v2/src/flow/__tests__/PluginFlowEngine.test.ts --run
yarn test:client packages/plugins/@nocobase/plugin-light-extension/src/client-v2/__tests__/plugin.test.tsx --run
yarn test:client packages/plugins/@nocobase/plugin-light-extension/src/client-v2/__tests__/runjs-editor-provider.test.tsx --run
yarn test:client packages/plugins/@nocobase/plugin-light-extension/src/client/__tests__/legacy-client-boundary.test.ts --run
yarn test:client packages/plugins/@nocobase/plugin-light-extension/src/client/__tests__/legacy-light-extension-runtime.integration.test.tsx --run
yarn test packages/core/cli/src/__tests__/light-extension-runtime-commands.test.ts --run
yarn test packages/core/cli/src/__tests__/runtime-generator-resource-segments.test.ts --run
