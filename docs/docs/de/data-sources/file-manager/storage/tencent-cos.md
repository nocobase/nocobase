:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Tencent COS

Dies ist ein Speicher-Engine, der auf Tencent Cloud COS basiert. Bevor Sie ihn nutzen, müssen Sie die entsprechenden Konten und Berechtigungen vorbereiten.

## Konfigurationsparameter

![Beispiel für die Konfiguration des Tencent COS Speicher-Engines](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Hinweis}
Dieser Abschnitt behandelt nur die spezifischen Parameter für den Tencent Cloud COS Speicher-Engine. Allgemeine Parameter finden Sie unter [Allgemeine Engine-Parameter](./index.md#allgemeine-engine-parameter).
:::

### Region

Geben Sie die Region des COS-Speichers ein, zum Beispiel: `ap-chengdu`.

:::info{title=Hinweis}
Sie können die Regionsinformationen des Speicher-Buckets in der [Tencent Cloud COS Konsole](https://console.cloud.tencent.com/cos) einsehen. Es genügt, den Präfix der Region zu verwenden (der vollständige Domainname ist nicht erforderlich).
:::

### SecretId

Geben Sie die ID des autorisierten Zugriffsschlüssels von Tencent Cloud ein.

### SecretKey

Geben Sie das Secret des autorisierten Zugriffsschlüssels von Tencent Cloud ein.

### Speicher-Bucket

Geben Sie den Namen des COS Speicher-Buckets ein, zum Beispiel: `qing-cdn-1234189398`.