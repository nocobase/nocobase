---
pkg: "@nocobase/plugin-field-signature"
---

# Collection field: Signature

## Introduction

The handwritten signature field lets users draw a signature on the canvas (mouse or touch). After saving, the signature image is stored in the selected **file collection** and uses the file upload and storage pipeline provided by **File manager**.

## Installation

1. Confirm your deployment is on **Professional edition or above** and the license is valid.
2. Open **Plugin manager**, find **Collection field: Handwritten Signature** (`@nocobase/plugin-field-signature`), and enable it.
3. Ensure **File manager** (`@nocobase/plugin-file-manager`) is enabled. The handwritten signature field depends on it to provide file collections, uploads, and storage capabilities; without it, signature images cannot be saved.

## Usage

### Add the field

In **Data sources** → select a collection → **Configure fields** → **Add field** → choose **Handwritten Signature** (under the media group).

### Field options

- **File collection**: required. Select a file collection used to store files (for example, `attachments`), and the signature image will be saved there.
- The actual storage used is determined by the selected file collection's own configuration.

### UI configuration

- After adding the handwritten signature field to a form, you can adjust **Signature settings** in the field UI configuration, including pen color, background color, canvas width, canvas height, thumbnail width, and thumbnail height.
- In read-only display scenarios, you can also adjust the thumbnail width and height to control the rendered size of the signature image.

### In the UI

- Click the field to open the signature canvas, draw, then confirm to upload and link the corresponding file record.
- On small screens, a full-screen / landscape signing experience may be used for easier drawing.
