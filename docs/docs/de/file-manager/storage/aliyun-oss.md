# Speicher-Engine: Aliyun OSS

Die Speicher-Engine basiert auf Aliyun OSS. Bevor Sie sie verwenden, müssen Sie die entsprechenden Konten und Berechtigungen vorbereiten.


:::warning Hinweis

Diese Engine unterstützt keinen privaten Zugriff. Nach dem Hochladen erzeugt NocoBase eine direkt zugängliche URL, und jeder, der diese URL besitzt, kann auf die Datei zugreifen.

Auch wenn der OSS-Bucket selbst privat ist, erzeugt die integrierte Aliyun OSS-Engine keine temporären signierten URLs für den Dateizugriff. Wenn Sie privaten Zugriff benötigen, verwenden Sie [S3 Pro](./s3-pro.md). Wenn bereits historische Dateien vorhanden sind, lesen Sie [Migration zu S3 Pro](./migrate-to-s3-pro.md).

:::

## Konfigurationsparameter

![Konfigurationsbeispiel für die Aliyun OSS Speicher-Engine](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Hinweis}
Hier werden nur die spezifischen Parameter der Aliyun OSS Speicher-Engine beschrieben. Allgemeine Parameter finden Sie unter [Allgemeine Engine-Parameter](./index.md#allgemeine-parameter).
:::

### Basis-URL

Geben Sie das Präfix der Dateizugriffs-URL ein, zum Beispiel eine an den aktuellen Bucket gebundene eigene Domäne: `https://oss.example.com`. Beim Zugriff auf PDF-Dateien über die Standarddomäne von Aliyun OSS kann der Browser sie herunterladen. Wir empfehlen, zuerst eine eigene Domäne zu binden. Weitere Informationen finden Sie unter [Häufige Probleme](#häufige-probleme).

### Region

Geben Sie die Region des OSS-Speichers ein, zum Beispiel: `oss-cn-hangzhou`.

:::info{title=Hinweis}
Die Regionsinformationen Ihres Buckets können Sie in der [Aliyun OSS Konsole](https://oss.console.aliyun.com/) einsehen. Sie benötigen lediglich den Regionspräfix (nicht den vollständigen Domainnamen).
:::

### AccessKey ID

Geben Sie die ID Ihres Aliyun-Zugriffsschlüssels ein.

### AccessKey Secret

Geben Sie das Secret Ihres Aliyun-Zugriffsschlüssels ein.

### Bucket

Geben Sie den Namen des OSS-Buckets ein.

### Timeout

Geben Sie die Timeout-Zeit für den Upload zu Aliyun OSS in Millisekunden ein. Der Standardwert beträgt `60000` Millisekunden (d.h. 60 Sekunden).

## Häufige Probleme

### Eine PDF-Datei wird heruntergeladen statt angezeigt

NocoBase zeigt Cross-Origin-PDFs in einem iframe an. Der Browser greift direkt auf die OSS-Datei-URL zu. Daher bestimmen die Antwortheader, ob die Datei angezeigt oder heruntergeladen wird.

Wenn die PDF-Datei aus dem iframe heruntergeladen wird, prüfen Sie die Anfrage im Netzwerkbereich der Browser-Entwicklertools. Eine typische problematische Antwort sieht so aus:

```http
Content-Type: application/pdf
Content-Disposition: attachment
x-oss-force-download: true
```

`Content-Type: application/pdf` identifiziert die Datei korrekt, aber `Content-Disposition: attachment` weist den Browser an, sie herunterzuladen. Die Standarddomäne von Aliyun OSS erzwingt in einigen Fällen Downloads. Weitere Informationen finden Sie in der offiziellen Dokumentation: [PDF-Datei zur Vorschau statt zum Download konfigurieren](https://help.aliyun.com/zh/oss/user-guide/how-do-i-configure-an-object-to-be-previewed-instead-of-downloaded).

Wir empfehlen folgende Konfiguration:

1. Folgen Sie [Über eine eigene Domäne auf OSS-Ressourcen zugreifen](https://help.aliyun.com/zh/oss/user-guide/access-buckets-via-custom-domain-names), um eine Domäne an den Bucket zu binden
2. Konfigurieren Sie DNS und das HTTPS-Zertifikat und prüfen Sie den direkten Dateizugriff über die eigene Domäne
3. Konfigurieren Sie die Zugriffs-URL für die verwendete NocoBase-Speicher-Engine

Für Schritt 3 gilt:

- Bei der integrierten Engine **Aliyun OSS** setzen Sie **Basis-URL** auf die gebundene Domäne, zum Beispiel `https://oss.example.com`
- Bei [S3 Pro](./s3-pro.md) mit Aliyun OSS kann der Upload-Endpoint weiterhin den regionalen OSS-Endpoint verwenden; setzen Sie den Zugriffs-Endpoint auf die eigene Domäne und `Full access URL style` auf `Ignore`

Laden Sie eine neue PDF-Datei hoch, um die Konfiguration zu prüfen. Wenn ein vorhandener Datensatz eine vollständige URL speichert, stellen Sie außerdem sicher, dass die an das Frontend zurückgegebene URL die eigene Domäne verwendet.

:::tip Antwortheader prüfen

Die iframe-Vorschau einer Cross-Origin-PDF benötigt selbst kein CORS. Ob die PDF-Datei eingebettet angezeigt werden kann, hängt hauptsächlich von `Content-Type` und `Content-Disposition` ab. Dies ist unabhängig von der unten beschriebenen CORS-Anforderung für die Download-Schaltfläche.

:::

### Das Bild wird angezeigt, aber die Download-Schaltfläche meldet einen CORS-Fehler

Bilder werden normalerweise mit `<img>` und Cross-Origin-PDFs mit einem iframe angezeigt. Beide können Ressourcen ohne CORS-Antwortheader darstellen. Die Download-Schaltfläche liest die Datei jedoch mit `fetch` und erstellt ein Blob. Diese Anfrage unterliegt der Same-Origin-Policy des Browsers.

Der folgende Fehler bedeutet, dass OSS für die aktuelle NocoBase-Site kein `Access-Control-Allow-Origin` zurückgegeben hat:

```text
Access to fetch at 'https://oss.example.com/path/to/file.jpg' from origin
'https://example.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Folgen Sie der offiziellen Anleitung [CORS konfigurieren](https://help.aliyun.com/zh/oss/user-guide/configure-cross-origin-resource-sharing) und erstellen Sie eine Regel für den Bucket. Für Downloads aus der Vorschaukomponente können Sie folgende Werte verwenden:

| Einstellung | Empfohlener Wert |
| --- | --- |
| Allowed Origins | Der vollständige Origin von NocoBase, zum Beispiel `https://example.com` |
| Allowed Methods | `GET`, `HEAD` |
| Allowed Headers | `*` |
| Expose Headers | `ETag`, `Content-Disposition` |
| MaxAgeSeconds | `600` |

Wenn S3 Pro Dateien auch direkt aus dem Browser hochlädt, fügen Sie anhand der tatsächlichen Upload-Anfragen im Netzwerkbereich Methoden wie `PUT` und `POST` hinzu oder erstellen Sie eine separate Upload-Regel.

Fordern Sie die Datei nach dem Speichern der Regel erneut mit dem Origin der NocoBase-Site an. Die Antwort sollte mindestens Folgendes enthalten:

```http
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, HEAD
```

Der Browser hat möglicherweise bereits die Antwort für die Bildvorschau zwischengespeichert. Diese Anfrage enthielt keinen `Origin`-Header, und die gespeicherte Antwort enthält möglicherweise kein `Access-Control-Allow-Origin`. Wenn der Download nach der CORS-Konfiguration weiterhin fehlschlägt, leeren Sie den Browser-Cache für die Datei oder aktivieren Sie in den Entwicklertools „Cache deaktivieren“ und versuchen Sie es erneut.

### Antwortheader überprüfen

Mit `curl` können Sie eine Cross-Origin-Anfrage von der NocoBase-Site simulieren. Ersetzen Sie Origin, Datei-URL und Signaturparameter aus dem Beispiel durch die tatsächlichen Werte:

```bash
curl -sS -D - -o /dev/null \
  -H 'Origin: https://example.com' \
  'https://oss.example.com/path/to/file.pdf?<signed-query>'
```

Prüfen Sie folgende Ergebnisse:

- Die PDF-Vorschau gibt `Content-Type: application/pdf` ohne `Content-Disposition: attachment` zurück
- Der Cross-Origin-Download gibt ein zur NocoBase-Site passendes `Access-Control-Allow-Origin` zurück
- Die tatsächliche Datei-URL verwendet die eigene Domäne statt der Standarddomäne `*.oss-cn-*.aliyuncs.com`

Es ist normal, dass eine Anfrage ohne `Origin`-Header keine CORS-Antwortheader erhält. Behalten Sie den `Origin`-Header aus dem Beispiel bei der CORS-Prüfung bei.

## Verwandte Links

- [Datei-Vorschau](../file-preview/index.md)
- [S3 Pro](./s3-pro.md)
- [Migration zu S3 Pro](./migrate-to-s3-pro.md)
- [Speicher-Engines](./index.md)
