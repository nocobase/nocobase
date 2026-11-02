# File Component UI

This Registry item installs editable App source for upload, list, thumbnail, and preview controls. The default destination is client/extensions/nocobase-file-component-ui. Import components and UI types from its index.ts.

Pass the public ClientFileRepository returned by the App's clientFileRepositoryManagerToken to FileUploadField as repository. Read-only components consume FileRecord arrays and their contentUrl directly; they require no repository prop. See the UI Library components section in the plugin's SKILL.md for installation, dependencies, and a complete React example.

Upload success is controlled by value/onChange. Temporary progress and error items stay internal. Use onStatusChange to block form submission while uploading or after a failure. Upload cancellation forwards AbortSignal; it does not guarantee rollback after a server commit. removeOnDelete removes metadata only. App-owned business relations and physical cleanup remain the App's responsibility.

Preview handles safe raster images, PDF, audio/video and text/Markdown. The content route serves attachments, so PDF is fetched and embedded as a local blob retyped to `application/pdf`; a response carrying an active markup type is reported as a preview failure rather than embedded, because a blob URL is same-origin. DOCX/XLSX/PPTX render locally with lazily loaded `@silurus/ooxml`; legacy Office and OpenDocument formats retain Office Online, which requires an internet-accessible absolute URL and cannot use the App session. Active HTML/SVG/XML and unsafe URL schemes are rejected. Markdown does not execute raw HTML.

Follow the plugin Skill's UI Library installation and preview sections for the exact viewer dependency, Vite dependency-prebundling exclusion, authentication adapter boundaries and acceptance checks. Same-origin content fetches use session cookies; external fetches omit credentials and require CORS. Bearer-only access requires changes to the App-owned source; setting `contentUrl` to an arbitrary blob URL is not supported. OOXML failures show an error and an optional download action; `download={false}` suppresses that action.

There is no public/private record flag or access-token endpoint. The item contains no extension.ts, route, collection, or Server implementation. A private disk does not authorize a content request. Installed copies belong to the App; review upgrades with a three-way merge and preserve customizations. Supply translated labels and adapt additional copy in installed source.

## Install and translate

Run `pnpm exec shadcn add @nocobase/file-component-ui` in a consuming project. In this repository, copy the files and dependencies declared in `ui-library/registry/file/registry.json` instead. Installed source belongs to the consumer.

Merge each installed `locales/<locale>.ts` default export into the matching application or consuming plugin resource, before local overrides. The block uses the current namespace, with English defaults; it does not require the original plugin namespace for presentation. All ten existing translations are included.

`FileList` adapts File records to the shared `attachment-list` component, preserving URL validation, download callbacks, and full file previews. The upload field accepts the repository's `uploadOne` and `deleteOne` operations. Preview sources keep their existing installed paths.

`FilePreviewDialog.onDownload` overrides downloads from both its toolbar and preview fallbacks, receives the currently displayed record, and may return a promise. Failures are forwarded to `onError`; `download={false}` hides both download actions. `FileList` forwards its custom download callback to the preview dialog so image downloads use the same handler as other files.
