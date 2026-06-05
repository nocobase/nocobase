:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Tencent Cloud COS

Dies ist ein Speicher-Engine, das auf Tencent Cloud COS basiert. Bevor Sie es nutzen können, müssen Sie die entsprechenden Konten und Berechtigungen einrichten.

## Konfigurationsparameter

![Beispiel für die Konfiguration des Tencent COS Speicher-Engines](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Hinweis}
Dieser Abschnitt stellt nur die spezifischen Parameter für das Tencent Cloud COS Speicher-Engine vor. Für allgemeine Parameter lesen Sie bitte [Allgemeine Engine-Parameter](./index.md#general-engine-parameters).
:::

### Region

Geben Sie die Region für den COS-Speicher ein, zum Beispiel: `ap-chengdu`.

:::info{title=Hinweis}
Sie können die Regionsinformationen Ihres Buckets in der [Tencent Cloud COS Konsole](https://console.cloud.tencent.com/cos) einsehen. Sie müssen nur das Regionspräfix verwenden (nicht den vollständigen Domainnamen).
:::

### SecretId

Geben Sie die ID Ihres Tencent Cloud Zugriffsschlüssels ein.

### SecretKey

Geben Sie das Secret Ihres Tencent Cloud Zugriffsschlüssels ein.

### Speicher-Bucket

Geben Sie den Namen des COS Speicher-Buckets ein, zum Beispiel: `qing-cdn-1234189398`.