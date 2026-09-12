---
pkg: '@nocobase/plugin-file-manager'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Datei-Vorschau

In Oberflächen mit Dateifeldern, einschließlich Anhangsfeldern, können Sie Dateien anzeigen, indem Sie auf die Miniaturansicht oder das Symbol der Datei klicken. Die integrierte Vorschaufunktion unterstützt verschiedene Dateitypen, darunter Bilder, PDFs und die meisten Dateitypen, die Browser nativ unterstützen.

![20251129232307](https://static-docs.nocobase.com/20251129232307.png)

Für Dateitypen ohne native Vorschau können Sie entsprechende Datei-Vorschau-Plugins installieren oder erweitern. Nach der Installation des Office-Datei-Vorschau-Plugins können Sie beispielsweise Word-, Excel- und PowerPoint-Dateien anzeigen.

Derzeit stellt NocoBase die folgenden Datei-Vorschau-Plugins bereit:

- [Office-Datei-Vorschau-Plugin](./ms-office.md)

## Funktionsweise der PDF-Vorschau

NocoBase wählt die Vorschauart danach aus, ob die URL der PDF-Datei denselben Origin wie die aktuelle Seite hat:

| Datei-URL | Üblicher Speicher | Vorschauart | CORS-Anforderung |
| --- | --- | --- | --- |
| Derselbe Origin wie NocoBase | Lokaler Speicher | NocoBase liest die Datei und rendert sie mit dem integrierten PDF.js | Kein Cross-Origin-CORS erforderlich |
| Anderer Origin | Externer Speicher wie OSS, S3, COS oder CDN | Der Browser öffnet die URL in einem iframe | Die iframe-Vorschau selbst benötigt kein CORS |

:::tip Entscheidungskriterium

Die Vorschauart hängt vom Origin der Datei-URL ab, nicht direkt vom Namen der Speicher-Engine. Lokaler Speicher, der über eine separate Dateidomäne ausgeliefert wird, gilt als Cross-Origin. Externer Speicher, der über einen NocoBase-Proxy mit demselben Origin erreichbar ist, gilt als Same-Origin.

:::

### Lokaler Speicher oder Same-Origin-URL

URLs des lokalen Speichers beginnen normalerweise mit `/storage/uploads/` und haben denselben Origin wie die NocoBase-Seite. Für die Vorschau liest NocoBase die PDF-Daten und rendert Seiten und Text mit dem integrierten PDF.js.

Diese Methode ist nicht vom integrierten PDF-Reader des Browsers abhängig. Selbst wenn die Antwort aus Sicherheitsgründen `Content-Disposition: attachment` verwendet, kann NocoBase die Datei lesen und in der Vorschaukomponente rendern. Die Datei-URL muss mit der aktuellen Anmeldung zugänglich sein.

### Externer Speicher oder Cross-Origin-URL

OSS, S3, COS und CDNs verwenden normalerweise eine separate Domäne. NocoBase setzt die PDF-URL in ein iframe. Das Ergebnis wird daher vom Browser und von den Antwortheadern des Speicherdienstes bestimmt.

Damit die PDF-Datei im iframe geöffnet wird, sollte der Speicherdienst normalerweise `Content-Type: application/pdf` zurückgeben und den Download nicht mit `Content-Disposition: attachment` erzwingen. Wenn die Antwort einen Download verlangt, lädt der Browser die Datei direkt herunter. NocoBase kann dieses Verhalten im Frontend nicht überschreiben.

Das Laden einer Cross-Origin-PDF in einem iframe benötigt selbst kein CORS. Die Download-Schaltfläche liest die Datei jedoch mit `fetch` und erstellt ein Blob. Cross-Origin-Downloads erfordern deshalb, dass der Speicherdienst CORS-Anfragen von der NocoBase-Site erlaubt.

### Hinweise zu Aliyun OSS

Die Standarddomäne von Aliyun OSS erzwingt in einigen Fällen einen Download, indem sie `Content-Disposition: attachment` und `x-oss-force-download: true` zurückgibt. Bilder können weiterhin normal angezeigt werden, während eine PDF-Datei im iframe heruntergeladen wird.

Normalerweise lässt sich das beheben, indem Sie eine eigene Domäne an den Bucket binden und NocoBase für den Dateizugriff über diese Domäne konfigurieren. Konfiguration und Diagnose finden Sie unter [Häufige Probleme mit Aliyun OSS](../storage/aliyun-oss.md#häufige-probleme).

### Sicherheitsgrenzen der Cross-Origin-Vorschau

Einige Browser oder PDF-Reader können Skripte, Formulare oder andere interaktive Inhalte in PDF-Dateien unterstützen. Wenn die Vorschau eine Datei aus einer nicht vertrauenswürdigen Quelle öffnet, sollten Sie auf die Sicherheitsgrenze für die Skriptausführung achten.

Wir empfehlen, die Dateizugriffsdomäne von der NocoBase-Site- und API-Domäne zu isolieren. Zum Beispiel können Dateien aus OSS, S3, COS oder einem CDN über eine eigene Domäne bereitgestellt werden, statt denselben Origin wie das NocoBase-Frontend oder die API zu verwenden.

Wenn sich die Dateidomäne von der API-Domäne unterscheidet und die API keinen CORS-Zugriff für die Dateidomäne aktiviert, werden Skripte in der PDF-Vorschau normalerweise durch die Same-Origin-Policy des Browsers eingeschränkt. Sie können die NocoBase-Seite, den Browser-Speicher oder API-Antworten nicht direkt lesen.

## Verwandte Links

- [Office-Datei-Vorschau-Plugin](./ms-office.md)
- [Aliyun OSS](../storage/aliyun-oss.md)
- [S3 Pro](../storage/s3-pro.md)
