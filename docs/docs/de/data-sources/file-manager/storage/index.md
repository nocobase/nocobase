:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Übersicht

## Integrierte Engines

NocoBase unterstützt derzeit die folgenden integrierten Engine-Typen:

- [Lokaler Speicher](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Bei der Systeminstallation wird automatisch eine lokale Speicher-Engine hinzugefügt, die Sie direkt nutzen können. Sie haben auch die Möglichkeit, neue Engines hinzuzufügen oder die Parameter bestehender Engines zu bearbeiten.

## Allgemeine Engine-Parameter

Neben den spezifischen Parametern für die verschiedenen Engine-Typen gibt es die folgenden allgemeinen Parameter (am Beispiel des lokalen Speichers):

![Beispiel für die Konfiguration einer Dateispeicher-Engine](https://static-docs.nocobase.com/20240529115151.png)

### Titel

Der Name der Speicher-Engine, zur besseren Erkennung durch Benutzer.

### Systemname

Der Systemname der Speicher-Engine, zur Identifikation durch das System. Er muss systemweit eindeutig sein. Wenn Sie dieses Feld leer lassen, wird der Name automatisch vom System generiert.

### Basis-URL für den Zugriff

Der Präfix der URL-Adresse, unter der die Datei extern zugänglich ist. Dies kann die Basis-URL eines CDN sein, zum Beispiel: "`https://cdn.nocobase.com/app`" (ohne den abschließenden Schrägstrich „`/`“).

### Pfad

Der relative Pfad, der beim Speichern von Dateien verwendet wird. Dieser Teil wird beim Zugriff automatisch an die finale URL angehängt. Zum Beispiel: "`user/avatar`" (ohne führenden oder abschließenden Schrägstrich „`/`“).

### Dateigrößenbeschränkung

Die Größenbeschränkung für Dateien, die auf diese Speicher-Engine hochgeladen werden. Dateien, die diese Größe überschreiten, können nicht hochgeladen werden. Die Standardbeschränkung des Systems beträgt 20 MB und kann auf maximal 1 GB angepasst werden.

### Dateityp

Hier können Sie die Typen der hochzuladenden Dateien einschränken. Verwenden Sie dazu das [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)-Syntaxformat. Zum Beispiel steht `image/*` für Bilddateien. Mehrere Typen können durch Kommas getrennt werden, z. B. `image/*, application/pdf` erlaubt sowohl Bild- als auch PDF-Dateien.

### Standard-Speicher-Engine

Wenn diese Option aktiviert ist, wird die Engine als Standard-Speicher-Engine des Systems festgelegt. Wenn in einem Anhangsfeld oder einer Datei-Sammlung keine Speicher-Engine angegeben ist, werden hochgeladene Dateien in der Standard-Speicher-Engine gespeichert. Die Standard-Speicher-Engine kann nicht gelöscht werden.

### Dateien beim Löschen von Datensätzen beibehalten

Wenn diese Option aktiviert ist, bleiben die in der Speicher-Engine hochgeladenen Dateien erhalten, auch wenn die Datensätze in der Anhangs- oder Datei-Sammlung gelöscht werden. Standardmäßig ist diese Option deaktiviert, was bedeutet, dass Dateien in der Speicher-Engine zusammen mit den Datensätzen gelöscht werden.

:::info{title=Tipp}
Nach dem Hochladen einer Datei setzt sich der finale Zugriffspfad aus mehreren Teilen zusammen:

```
<Basis-URL für den Zugriff>/<Pfad>/<Dateiname><Dateierweiterung>
```

Zum Beispiel: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::