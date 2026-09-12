---
title: "Tencent Cloud COS"
description: "Konfiguration der Tencent-Cloud-COS-Speicher-Engine: Bucket, Region und SecretId für den Upload von Dateien in den Objektspeicher."
keywords: "Tencent Cloud COS,Tencent Cloud-Objektspeicher,COS-Speicher,Cloud-Speicher,NocoBase"
---

# Tencent Cloud COS

Die auf Tencent Cloud COS basierende Speicher-Engine. Vor der Verwendung müssen die entsprechenden Konten und Berechtigungen vorbereitet werden.

## Konfigurationsparameter

![Beispiel für die Konfiguration der Tencent-COS-Speicher-Engine](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Hinweis}
Hier werden nur die spezifischen Parameter der Tencent-Cloud-COS-Speicher-Engine beschrieben. Informationen zu den allgemeinen Parametern finden Sie unter [Allgemeine Engine-Parameter](./index.md#引擎通用参数).
:::

### Region

Geben Sie die Region des COS-Speichers ein, zum Beispiel: `ap-chengdu`.

:::info{title=Hinweis}
Die Regionsinformationen des Speicherbereichs können Sie in der [Tencent-Cloud-COS-Konsole](https://console.cloud.tencent.com/cos) einsehen. Es muss nur der Regionspräfix angegeben werden (der vollständige Domainname ist nicht erforderlich).
:::

### SecretId

Geben Sie die ID des Tencent-Cloud-Zugriffsschlüssels ein.

### SecretKey

Geben Sie das Secret des Tencent-Cloud-Zugriffsschlüssels ein.

### Bucket

Geben Sie den Namen des COS-Buckets ein, zum Beispiel: `qing-cdn-1234189398`.