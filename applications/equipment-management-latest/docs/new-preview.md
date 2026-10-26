# Isolated equipment preview

This directory restores the complete equipment application from source revision 85c7868 into a new application workspace. It never reads the earlier preview's database, runtime configuration or account credentials. The deployment App ID is equipment-pm697-latest; the package and translation namespace remain equipment-management because the existing business source uses that identity.

## Build

Install dependencies with `pnpm install --frozen-lockfile`. Build with `bash scripts/rebuild-final.sh` from this directory. The script retains the reviewed production resolutions in `docs/deployment/production-lock.yaml`, uses the official CLI to compile the application and generate the Foundation manifest, reinstalls production dependencies offline with the frozen lock after the initial build has populated the cache, retargets native modules and packages `storage/exports/dist.tar.gz`.

The earlier rebuild helper incorrectly passed target flags to clean-dist-bin, which interprets its first argument as a directory. The corrected script invokes clean-dist-bin without arguments and supplies platform flags only to retarget-native. Both the clean build and the archive must pass before upload.

## First installation

Create a separate Studio App in the preview environment and upload the archive without deploying it. Keep the first administrator password under Studio's existing native generation mechanism. Set APP_SAMPLE_DATA to true. EQUIPMENT_SAMPLE_PASSWORD is a secret, first-install-only native variable with the supported password generator. To know the three sample accounts' password, enter a new preview-only value of at least 16 characters in that App's Variables page before the first deployment; do not reuse an earlier App's value or post it in comments. If left unset, Studio may generate it; that value is not exposed to agents and is not the administrator password. The owner can manage the sample users through native Users administration after signing in.

Sample users are equipment.manager (Equipment manager), equipment.member (Member plus Equipment member), and equipment.viewer (Equipment member). The default Member role does not grant equipment access. The sample initializer creates 100 assets and synthetic reference, movement, maintenance, request and stocktake data only when first-install sample provisioning is enabled. Existing records are not reset on later starts. A requested sample installation without a valid private sample password now fails startup instead of exposing a healthy empty preview.

Inspect health, native login, sample counts, permissions, Foundation associations and a complete equipment operation after deployment. Do not use a localhost test address as the delivery preview. No model, email, OAuth or telemetry integration is enabled for this preview.
