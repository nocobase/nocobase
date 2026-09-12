---
title: "Alibaba Cloud OSS"
description: "Konfiguration der Alibaba-Cloud-OSS-Speicher-Engine: Bucket, Endpoint und AccessKey; unterstützt den Zugriff über das öffentliche und das private Netzwerk."
keywords: "Alibaba Cloud OSS, Alibaba-Cloud-Objektspeicher, OSS-Speicher, Cloud-Speicher, NocoBase"
---

# Alibaba Cloud OSS

Die auf Alibaba Cloud OSS basierende Speicher-Engine setzt voraus, dass vor der Verwendung die entsprechenden Konten und Berechtigungen vorbereitet werden.

## Konfigurationsparameter

![Beispiel für die Konfiguration der Alibaba-Cloud-OSS-Speicher-Engine](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Hinweis}
Hier werden nur die spezifischen Parameter der Alibaba-Cloud-OSS-Speicher-Engine beschrieben. Allgemeine Parameter finden Sie unter [Allgemeine Parameter der Engine](./index.md#引擎通用参数).
:::

### Region

Geben Sie die Region des OSS-Speichers ein, zum Beispiel: `oss-cn-hangzhou`.

:::info{title=Hinweis}
Die Regionsinformationen des Speicher-Buckets können Sie in der [Alibaba-Cloud-OSS-Konsole](https://oss.console.aliyun.com/) einsehen. Es genügt, den Regionspräfix zu übernehmen; die vollständige Domain ist nicht erforderlich.
:::

### AccessKey ID

Geben Sie die ID des autorisierten Alibaba-Cloud-Zugriffsschlüssels ein.

### AccessKey Secret

Geben Sie das Secret des autorisierten Alibaba-Cloud-Zugriffsschlüssels ein.

### Bucket

Geben Sie den Namen des OSS-Speicher-Buckets ein.
