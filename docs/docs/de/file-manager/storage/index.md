# Übersicht

## Einführung

Speicher-Engines dienen dazu, Dateien in bestimmten Diensten zu speichern, wie zum Beispiel im lokalen Speicher (auf der Festplatte des Servers) oder in Cloud-Speichern.

Bevor Sie Dateien hochladen können, müssen Sie eine Speicher-Engine konfigurieren. Bei der Systeminstallation wird automatisch eine lokale Speicher-Engine hinzugefügt, die Sie direkt verwenden können. Sie haben auch die Möglichkeit, neue Engines hinzuzufügen oder die Parameter bestehender Engines zu bearbeiten.

## Speicher-Engine-Typen

NocoBase unterstützt derzeit die folgenden integrierten Engine-Typen:

- [Lokaler Speicher](./local)
- [Amazon S3](./amazon-s3)
- [Aliyun OSS](./aliyun-oss)
- [Tencent COS](./tencent-cos)
- [S3 Pro](./s3-pro)

Bei der Systeminstallation wird automatisch eine lokale Speicher-Engine hinzugefügt, die Sie direkt verwenden können. Sie haben auch die Möglichkeit, neue Engines hinzuzufügen oder die Parameter bestehender Engines zu bearbeiten.


Wenn Sie bereits eine Speicher-Engine verwenden, die nur öffentlichen Zugriff unterstützt, und historische Dateien zu S3 Pro migrieren möchten, lesen Sie [Migration zu S3 Pro](./migrate-to-s3-pro.md).

## Dateizugriff

Verschiedene Speicher-Engines unterstützen unterschiedliche Zugriffskontrollen für Dateien. Prüfen Sie vor der Konfiguration, ob Ihre Dateien privaten Zugriff benötigen:

| Speicher-Engine | Dateizugriff |
| --- | --- |
| [Local Storage](./local) | Nur öffentlicher Zugriff wird unterstützt; privater Zugriff wird nicht unterstützt |
| [Amazon S3](./amazon-s3) | Nur öffentlicher Zugriff wird unterstützt; privater Zugriff wird nicht unterstützt |
| [Aliyun OSS](./aliyun-oss) | Nur öffentlicher Zugriff wird unterstützt; privater Zugriff wird nicht unterstützt |
| [Tencent COS](./tencent-cos) | Nur öffentlicher Zugriff wird unterstützt; privater Zugriff wird nicht unterstützt |
| [S3 Pro](./s3-pro) | Privater Zugriff wird über temporäre signierte URLs unterstützt |

:::warning Hinweis

Lokaler Speicher, Amazon S3, Aliyun OSS und Tencent COS führen keine Login-Prüfung für den Dateizugriff durch und erzeugen keine temporären signierten URLs. Nach dem Hochladen kann jeder, der die Datei-URL besitzt, direkt auf die Datei zugreifen.

Wenn Sie Verträge, Ausweisdokumente, interne Unterlagen oder andere nicht öffentliche Dateien speichern müssen, verwenden Sie [S3 Pro](./s3-pro) und aktivieren Sie privaten Zugriff.

:::

## Allgemeine Parameter

Neben den spezifischen Parametern für die verschiedenen Engine-Typen sind die folgenden Abschnitte allgemeine Parameter (am Beispiel des lokalen Speichers):

![Beispiel für die Konfiguration einer Dateispeicher-Engine](https://static-docs.nocobase.com/20240529115151.png)

### Titel

Der Name der Speicher-Engine zur besseren Identifizierung.

### Systemname

Der Systemname der Speicher-Engine, der zur Systemidentifizierung dient. Er muss innerhalb des Systems eindeutig sein. Wenn Sie ihn leer lassen, wird er vom System automatisch zufällig generiert.

### Öffentliches URL-Präfix

Der Präfix-Teil der öffentlich zugänglichen URL für die Datei. Dies kann die Basis-URL eines CDN sein, zum Beispiel: „`https://cdn.nocobase.com/app`“ (ohne abschließenden „`/`“).

### Pfad

Der relative Pfad, der beim Speichern von Dateien verwendet wird. Dieser Teil wird beim Zugriff automatisch an die finale URL angehängt. Zum Beispiel: „`user/avatar`“ (ohne führenden oder abschließenden „`/`“).

### Dateigrößenbeschränkung

Die Größenbeschränkung für Dateien, die mit dieser Speicher-Engine hochgeladen werden. Dateien, die diese Größe überschreiten, können nicht hochgeladen werden. Die Standardbeschränkung des Systems beträgt 20 MB und kann auf maximal 1 GB angepasst werden.

### Dateitypen

Sie können die Typen der hochzuladenden Dateien einschränken, indem Sie das [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)-Syntaxformat verwenden. Zum Beispiel steht `image/*` für Bilddateien. Mehrere Typen können durch Kommas getrennt werden, wie z.B.: `image/*, application/pdf`, was Bild- und PDF-Dateien erlaubt.

### Standard-Speicher-Engine

Wenn diese Option aktiviert ist, wird die Engine als Standard-Speicher-Engine des Systems festgelegt. Wenn in einem Anhangsfeld oder einer Datei-Sammlung keine Speicher-Engine angegeben ist, werden die hochgeladenen Dateien in der Standard-Speicher-Engine gespeichert. Die Standard-Speicher-Engine kann nicht gelöscht werden.

### Datei beim Löschen des Datensatzes beibehalten

Wenn diese Option aktiviert ist, bleibt die hochgeladene Datei in der Speicher-Engine erhalten, auch wenn der Datensatz in der Anhangs- oder Datei-Sammlung gelöscht wird. Standardmäßig ist diese Option nicht aktiviert, was bedeutet, dass die Datei in der Speicher-Engine zusammen mit dem Datensatz gelöscht wird.

:::info{title=Tipp}
Nach dem Hochladen einer Datei setzt sich der finale Zugriffspfad aus mehreren Teilen zusammen:

```
<Öffentliches URL-Präfix>/<Pfad>/<Dateiname><Dateierweiterung>
```

Zum Beispiel: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::