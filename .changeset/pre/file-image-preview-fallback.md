---
'@nocobase/app-plugin-file': patch
'@nocobase/app-template-default': patch
---

Explain a broken image in the file preview instead of showing a broken icon

The Registry preview rendered images as a bare `<img>`, so a corrupt or mislabelled image, such as a `.png` whose bytes are not a PNG, left a broken-image icon with no explanation, while PDF and Office previews already fell back to a message and a download button. The image branch now listens for the image's `error` event and switches to the same download fallback with the localizable `files.imageFailed` message. The fallback shows the file-type icon rather than loading the failed image again, through the new `iconOnly` prop of `FileThumbnail`, and `FileThumbnail` also drops to its file-type icon when its image fails to load, so file lists no longer show a broken icon either. An application that copied the Registry source only to add this fallback can take the updated component instead. The Default template ships the refreshed copy, so applications created from it get the fallback without updating the Registry component.
