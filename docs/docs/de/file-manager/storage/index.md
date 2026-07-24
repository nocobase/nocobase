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
Wenn „Ursprüngliche URL“ ausgewählt ist, setzt sich die endgültige Speicheradresse aus mehreren Teilen zusammen:

```
<Öffentliches URL-Präfix>/<Pfad>/<Dateiname><Dateierweiterung>
```

Zum Beispiel: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.

Wenn „NocoBase-URL“ ausgewählt ist, gibt der Dateidatensatz einen NocoBase-Pfad im Format `/files/...` zurück. Beim Zugriff auf den Speicherdienst wird weiterhin die obige Konfiguration verwendet.
:::

## Datei-URLs und Zugriffskontrolle

Eine Speicher-Engine kann entweder eine NocoBase-URL oder die ursprüngliche URL des Speicherdienstes zurückgeben. Standardmäßig wird die NocoBase-URL verwendet. Wählen Sie die ursprüngliche URL nur aus, wenn ein externer Dienst die Speicheradresse direkt verwenden muss.

Diese Einstellung gilt pro Speicher-Engine. Nach dem Speichern geben sowohl vorhandene als auch neu hochgeladene Dateien dieser Engine URLs in der gewählten Form zurück. Dateien werden weder verschoben noch erneut hochgeladen.

![Konfiguration der Datei-URL](https://static-docs.nocobase.com/20260723221234.png)

### NocoBase-URL

Der Dateidatensatz gibt einen von NocoBase bereitgestellten Zugriffspfad zurück, zum Beispiel:

```text
/files/main/main/attachments/1.png
```

Anfragen an diese URL durchlaufen zuerst NocoBase und folgen den für den entsprechenden Dateidatensatz konfigurierten Leseberechtigungen. Erst nach erfolgreicher Berechtigungsprüfung liest NocoBase die Datei oder leitet zur vom Speicherdienst erzeugten Adresse weiter.

Dies ist die empfohlene Standardeinstellung. Der Dateidatensatz gibt einen NocoBase-Pfad zurück, sodass aufrufende Anwendungen nicht wissen müssen, ob lokaler oder Cloud-Speicher verwendet wird.

### Ursprüngliche URL

Der Dateidatensatz gibt direkt die vom Speicherdienst erzeugte Adresse zurück, zum Beispiel:

```text
https://storage.example.com/path/to/file.png
```

Diese URL durchläuft NocoBase nicht und prüft die Leseberechtigungen des Dateidatensatzes nicht. Bei lokalem Speicher handelt es sich um eine lokale statische Dateiadresse, bei Cloud-Speicher normalerweise um eine Objekt-Speicher- oder CDN-Adresse.

Wählen Sie die ursprüngliche URL nur aus, wenn Markdown, eine externe Seite oder ein Drittanbieterdienst die Speicheradresse direkt verwenden muss.

:::warning Hinweis

Nach Auswahl der ursprünglichen URL kann jeder mit einer gültigen URL die NocoBase-Berechtigungsprüfung umgehen und auf die Datei zugreifen. Wenn die URL keine Signatur oder Ablaufzeit besitzt, müssen Bucket und Datei öffentlich lesbar sein.

:::

### Öffentlichen Zugriff erlauben

„Öffentlichen Zugriff erlauben“ ist nur wirksam, wenn „NocoBase-URL“ ausgewählt ist. Wenn die Option aktiviert ist, gibt die Speicher-Engine weiterhin eine NocoBase-URL zurück, NocoBase prüft beim Zugriff jedoch nicht mehr die Berechtigungen des Dateidatensatzes. Jeder mit der URL kann auf die Datei zugreifen.

Diese Option ändert nicht die Konfiguration für öffentlichen Lesezugriff im Speicherdienst. Sie steuert nur, ob NocoBase die Berechtigungen des Dateidatensatzes prüft.

### Auswahlhilfe

| Anwendungsfall | Datei-URL | Öffentlichen Zugriff erlauben |
| --- | --- | --- |
| Dateien müssen Rollen- und Datenberechtigungen folgen | NocoBase-URL | Nicht aktiviert |
| Eine öffentlich teilbare NocoBase-Dateiadresse wird benötigt | NocoBase-URL | Aktiviert |
| Markdown, eine externe Seite oder ein Drittanbieterdienst muss die Speicheradresse direkt lesen | Ursprüngliche URL | Nicht anwendbar |

:::warning Hinweis

[Lokaler Speicher](./local), [Amazon S3](./amazon-s3), [Aliyun OSS](./aliyun-oss) und [Tencent COS](./tencent-cos) erzeugen keine temporären signierten URLs. Selbst wenn die NocoBase-URL und Dateidatensatzberechtigungen aktiviert sind, können Personen, die bereits die ursprüngliche Adresse des Speicherdienstes kennen, weiterhin direkt auf die Datei zugreifen.

Verwenden Sie für Verträge, Ausweisdokumente, interne Unterlagen oder andere nicht öffentliche Dateien [S3 Pro](./s3-pro) und beachten Sie dessen spezielle Zugriffskonfiguration.

:::

Wenn Sie bereits eine öffentliche Speicher-Engine verwenden und vorhandene Dateien zu S3 Pro migrieren möchten, lesen Sie [Migration zu S3 Pro](./migrate-to-s3-pro.md).
