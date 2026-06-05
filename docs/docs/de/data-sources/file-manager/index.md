---
pkg: "@nocobase/plugin-file-manager"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Dateimanager

## Einführung

Das Dateimanager-Plugin bietet eine Dateisammlung, Anhangsfelder und Dateispeicher-Engines zur effizienten Verwaltung von Dateien. Dateien sind Datensätze in einer speziellen Art von Sammlung, die als Dateisammlung bezeichnet wird. Diese speichert Dateimetadaten und kann über den Dateimanager verwaltet werden. Anhangsfelder sind spezifische Verknüpfungsfelder, die mit der Dateisammlung verknüpft sind. Das Plugin unterstützt verschiedene Speichermethoden. Zu den derzeit unterstützten Dateispeicher-Engines gehören die lokale Speicherung, Alibaba Cloud OSS, Amazon S3 und Tencent Cloud COS.

## Benutzerhandbuch

### Dateisammlung

Eine `attachments`-Sammlung ist integriert, um alle Dateien zu speichern, die mit Anhangsfeldern verknüpft sind. Darüber hinaus können Sie neue Dateisammlungen erstellen, um spezifische Dateien zu speichern.

[Erfahren Sie mehr in der Dokumentation zur Dateisammlung](/data-sources/file-manager/file-collection)

### Anhangsfeld

Anhangsfelder sind spezifische Verknüpfungsfelder, die mit der Dateisammlung verknüpft sind, und können über den Feldtyp „Anhang“ erstellt oder über ein „Verknüpfungsfeld“ konfiguriert werden.

[Erfahren Sie mehr in der Dokumentation zum Anhangsfeld](/data-sources/file-manager/field-attachment)

### Dateispeicher-Engine

Die Dateispeicher-Engine wird verwendet, um Dateien in bestimmten Diensten zu speichern, einschließlich lokaler Speicherung (Speicherung auf der Festplatte des Servers), Cloud-Speicherung usw.

[Erfahren Sie mehr in der Dokumentation zur Dateispeicher-Engine](./storage/index.md)

### HTTP API

Datei-Uploads können über die HTTP API verarbeitet werden, siehe [HTTP API](./http-api.md).

## Entwicklung

*