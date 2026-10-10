# File Component UI

This Registry item installs editable App source for upload, list, thumbnail, and preview controls. The default destination is client/extensions/nocobase-file-component-ui. Import components and UI types from its index.ts.

Pass the public ClientFileRepository returned by the App's clientFileRepositoryManagerToken to FileUploadField as repository. Read-only components consume FileRecord arrays and their contentUrl directly; they require no repository prop. See the Registry components section in the plugin's SKILL.md for installation, dependencies, and a complete React example.

Upload success is controlled by value/onChange. Temporary progress and error items stay internal. Use onStatusChange to block form submission while uploading or after a failure. Upload cancellation forwards AbortSignal; it does not guarantee rollback after a server commit. removeOnDelete removes metadata only. App-owned business relations and physical cleanup remain the App's responsibility.

Preview handles safe raster images, PDF through a fetched local blob, audio/video and text/Markdown. DOCX/XLSX/PPTX render locally with lazily loaded `@silurus/ooxml`; legacy Office and OpenDocument formats retain Office Online, which requires an internet-accessible absolute URL and cannot use the App session. Active HTML/SVG/XML and unsafe URL schemes are rejected. Markdown does not execute raw HTML.

Follow the plugin Skill's Registry installation and preview sections for the exact viewer dependency, Vite dependency-prebundling exclusion, authentication adapter boundaries and acceptance checks. Same-origin content fetches use session cookies; external fetches omit credentials and require CORS. Bearer-only access requires changes to the App-owned source; setting `contentUrl` to an arbitrary blob URL is not supported. OOXML failures show an error and an optional download action; `download={false}` suppresses that action.

There is no public/private record flag or access-token endpoint. The item contains no extension.ts, route, collection, or Server implementation. A private disk does not authorize a content request. Installed copies belong to the App; review upgrades with a three-way merge and preserve customizations. Supply translated labels and adapt additional copy in installed source.
