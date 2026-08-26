---
title: "Scan Code Input"
description: "Field settings: enable scan code input for text form fields, supporting writing field values through QR codes or barcodes."
keywords: "scan code input,QR code,barcode,field settings,interface builder,NocoBase"
---

# Scan Code Input

## Introduction

Scan code input is used for text fields in editable forms. After it is enabled, a scan button appears on the right side of the field input. Users can scan a QR code or barcode, or select an image from the album for recognition, and write the recognized result into the current field.

It is typically suitable for entering values such as device numbers, asset codes, order numbers, and tracking numbers that are inconvenient to type manually.

## Supported Fields

Scan code input is mainly used for text-based fields, such as:

- Single line text
- Mobile phone
- Email
- URL
- UUID
- Nano ID

If the field is read-only, in reading mode, or does not support editable input itself, the scan code input configuration will not be shown.

## Configuration

Select the corresponding field in a form block, open the field configuration menu, and find `Scan Code Input Settings`.

Options include:

- `Enable scan code input`: after enabling, a scan button is shown on the right side of the input box
- `Disable manual input`: after enabling, users can only write the field value by scanning and cannot edit the input box manually

After `Enable scan code input` is turned off, `Disable manual input` also becomes inactive.

## Usage

After the user clicks the scan button on the right side of the field, they can use the camera to recognize a QR code or barcode. Browser-based scanning requires permission to access the camera. In mobile environments that support native scan capabilities, the native mobile scan capability is used first.

If it is not convenient to use the camera directly, users can also click `Album` to select an image for recognition.
