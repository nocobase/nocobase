---
title: "Dateispeicher-Engine"
description: "Speicher-Engines für das Anhangsfeld: lokaler Speicher, Alibaba Cloud OSS, Amazon S3, Tencent Cloud COS, S3 Pro sowie die Konfiguration von Titel, Pfad, Zugriffs-URL usw."
keywords: "Dateispeicher,Storage,OSS,S3,COS,lokaler Speicher,Cloud-Speicher,NocoBase"
---

# Übersicht

## Integrierte Engines

NocoBase unterstützt derzeit standardmäßig die folgenden Engine-Typen:

- [Lokaler Speicher](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Bei der Systeminstallation wird automatisch eine Engine für den lokalen Speicher hinzugefügt, die direkt verwendet werden kann. Sie können auch neue Engines hinzufügen oder die Parameter vorhandener Engines bearbeiten.

## Allgemeine Parameter der Engine

Neben den enginespezifischen Parametern sind die folgenden Parameter allgemeingültig (am Beispiel des lokalen Speichers):

![Beispielkonfiguration einer Dateispeicher-Engine](https://static-docs.nocobase.com/20240529115151.png)

### Titel

Der Name der Speicher-Engine zur manuellen Identifizierung.

### Systemname

Der Systemname der Speicher-Engine zur Identifizierung durch das System. Er muss innerhalb des Systems eindeutig sein. Wenn kein Name angegeben wird, generiert das System automatisch einen zufälligen Namen.

### Basis der Zugriffs-URL

Der Präfix der URL-Adresse, unter der die Datei extern erreichbar ist. Dies kann beispielsweise die Basis-URL für den Zugriff über ein CDN sein, etwa „`https://cdn.nocobase.com/app`“ (ohne abschließendes „`/`“).

### Pfad

Der relative Pfad, der zum Speichern der Dateien verwendet wird. Beim Zugriff wird dieser Teil automatisch an die endgültige URL angehängt. Beispiel: „`user/avatar`“ (ohne führendes oder abschließendes „`/`“).

### Dateigrößenbeschränkung

Die Größenbeschränkung für Dateien, die in diese Speicher-Engine hochgeladen werden. Dateien, die diese Größe überschreiten, können nicht hochgeladen werden. Die Standardbeschränkung des Systems beträgt 20 MB und kann auf maximal 1 GB angepasst werden.

### Dateityp

Der Typ der hochzuladenden Dateien kann eingeschränkt werden. Verwenden Sie zur Beschreibung das [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)-Format. Beispiel: `image/*` steht für Bilddateien. Mehrere Typen können durch englische Kommas getrennt werden, z. B. `image/*, application/pdf` für Bilddateien und PDF-Dateien.

### Standard-Speicher-Engine

Nach der Aktivierung wird diese Engine als Standardspeicher-Engine des Systems festgelegt. Wenn in einem Anhangsfeld oder einer Dateitabelle keine Speicher-Engine angegeben ist, werden hochgeladene Dateien in der Standard-Speicher-Engine gespeichert. Die Standard-Speicher-Engine kann nicht gelöscht werden.

### Dateien beim Löschen von Datensätzen beibehalten

Wenn diese Option aktiviert ist, bleiben die bereits in der Speicher-Engine hochgeladenen Dateien erhalten, auch wenn Datensätze in der Anhangs- oder Dateitabelle gelöscht werden. Standardmäßig ist die Option deaktiviert. Beim Löschen eines Datensatzes werden die Dateien in der Speicher-Engine dann ebenfalls gelöscht.

:::info{title=Hinweis}
Nach dem Hochladen einer Datei wird der endgültige Zugriffspfad aus mehreren Teilen zusammengesetzt:

```
<访问 URL 基础>/<路径>/<文件名><后缀名>
```

Beispiel: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::