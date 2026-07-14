/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsonRecord, ModelRecord, getModelJson, getModelValue, getRecord, getString } from '../../actions/utils';
import { parseSharedStorageObject } from '../../services/sharedFileStorage';

interface ArtifactGroupDeclaration {
  path?: string;
  glob?: string;
  groupKey?: string;
  groupLabel?: string;
}

export function serializeModel(model: ModelRecord) {
  return getModelJson(model);
}

export function serializeArtifact(model: ModelRecord) {
  const {
    storageId: _storageId,
    objectPath: _objectPath,
    objectFilename: _objectFilename,
    objectKey: _objectKey,
    storageSizeBytes: _storageSizeBytes,
    storageSha256: _storageSha256,
    contentText: _contentText,
    ...artifact
  } = serializeModel(model);
  return artifact;
}

export function getArtifactStorageObject(artifact: ModelRecord) {
  const artifactId = String(getModelValue(artifact, 'id') || '');
  const runId = String(getModelValue(artifact, 'runId') || '');
  return parseSharedStorageObject(
    {
      storageId: getModelValue(artifact, 'storageId'),
      objectPath: getModelValue(artifact, 'objectPath'),
      objectFilename: getModelValue(artifact, 'objectFilename'),
      objectKey: getModelValue(artifact, 'objectKey'),
      sizeBytes: getModelValue(artifact, 'storageSizeBytes'),
      mimetype: getModelValue(artifact, 'mimeType'),
    },
    { path: `agent-gateway/run-artifacts/${runId}/${artifactId}` },
  );
}

function normalizeArtifactPath(value: string) {
  return value
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '')
    .replace(/^([A-Za-z]:)?\/+/, '$1');
}

function escapeRegex(value: string) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegex(pattern: string) {
  let source = '^';
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char !== '*') {
      source += escapeRegex(char);
      continue;
    }
    if (pattern[index + 1] === '*') {
      index += 1;
      if (pattern[index + 1] === '/') {
        index += 1;
        source += '(?:.*\\/)?';
      } else {
        source += '.*';
      }
      continue;
    }
    source += '[^/]*';
  }
  return new RegExp(`${source}$`);
}

function getArtifactGroupDeclarations(run: ModelRecord) {
  const payload = getRecord(getModelValue(run, 'executionPayloadJson'));
  const artifacts = Array.isArray(payload.artifacts) ? payload.artifacts : [];
  const declarations: ArtifactGroupDeclaration[] = [];
  for (const value of artifacts) {
    const record = getRecord(value);
    const artifactPath = getString(record.path || record.filePath);
    const glob = getString(record.glob || record.pattern);
    const groupKey = getString(record.groupKey);
    const groupLabel = getString(record.groupLabel || record.group);
    if ((!artifactPath && !glob) || (!groupKey && !groupLabel)) {
      continue;
    }
    declarations.push({
      ...(artifactPath ? { path: normalizeArtifactPath(artifactPath) } : {}),
      ...(glob ? { glob: normalizeArtifactPath(glob) } : {}),
      ...(groupKey ? { groupKey } : {}),
      ...(groupLabel ? { groupLabel } : {}),
    });
  }
  return declarations;
}

function getDeclaredArtifactRelativePath(artifact: JsonRecord) {
  const metadata = getRecord(artifact.metadataJson);
  const relativePath = getString(metadata.relativePath);
  if (relativePath) {
    return normalizeArtifactPath(relativePath);
  }
  const artifactKey = getString(artifact.artifactKey);
  return artifactKey.startsWith('declared:') ? normalizeArtifactPath(artifactKey.slice('declared:'.length)) : '';
}

function findArtifactGroupDeclaration(relativePath: string, declarations: ArtifactGroupDeclaration[]) {
  if (!relativePath) {
    return null;
  }
  return (
    declarations.find(
      (declaration) =>
        (declaration.path && normalizeArtifactPath(declaration.path) === relativePath) ||
        (declaration.glob && globToRegex(declaration.glob).test(relativePath)),
    ) || null
  );
}

export function applyDeclaredArtifactGroups(artifacts: JsonRecord[], run: ModelRecord) {
  const declarations = getArtifactGroupDeclarations(run);
  if (!declarations.length) {
    return artifacts;
  }
  return artifacts.map((artifact) => {
    const metadata = getRecord(artifact.metadataJson);
    if (getString(metadata.artifactGroupKey) || getString(metadata.artifactGroupLabel)) {
      return artifact;
    }
    const declaration = findArtifactGroupDeclaration(getDeclaredArtifactRelativePath(artifact), declarations);
    if (!declaration) {
      return artifact;
    }
    return {
      ...artifact,
      metadataJson: {
        ...metadata,
        ...(declaration.groupKey ? { artifactGroupKey: declaration.groupKey } : {}),
        ...(declaration.groupLabel ? { artifactGroupLabel: declaration.groupLabel } : {}),
      },
    };
  });
}
