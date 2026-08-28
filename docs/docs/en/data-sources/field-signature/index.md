---
pkg: "@nocobase/plugin-field-signature"
---

# Collection field: Handwritten signature

## Introduction

The Handwritten signature field lets users write a signature on a canvas with a mouse or touch screen. After saving, the signature image is written to the selected **File collection** and uses the file-upload and storage flow provided by **File manager**.

## Installation

1. Confirm that the current environment is Professional edition or higher and has a valid license.
2. Open **Plugin manager**, find **Collection field: Handwritten signature** (`@nocobase/plugin-field-signature`), and enable it.
3. Enable **File manager** (`@nocobase/plugin-file-manager`). The Handwritten signature field depends on its File collection, upload, and storage capabilities; it cannot save signature images when File manager is disabled.

## Usage

### Add a field

Open **Data source** -> select a collection -> **Configure fields** -> **Add field**, then choose **Handwritten signature** in the Media group.

### Field configuration

- **File collection**: Required. Select a File collection used to store files, such as `attachments`; signature images are saved there
- The storage configuration and upload rules used by signature images are determined by the selected File collection

### Interface configuration

- After adding a Handwritten signature field to a form, adjust **Signature settings** in the field interface settings, including stroke color, background color, signature-canvas width and height, and thumbnail width and height
- In read-only display scenarios, adjust thumbnail width and height to control the display size of signature images

### Interface operations

- Click the field area to open the signature canvas. After writing, confirm the signature to upload and relate the corresponding file record
- On small-screen devices, use a landscape or full-screen signature interface for easier writing

![Handwritten signature](https://static-docs.nocobase.com/20260709232226.png)
