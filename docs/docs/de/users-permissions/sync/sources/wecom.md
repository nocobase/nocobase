---
pkg: "@nocobase/plugin-wecom"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Benutzerdaten aus WeChat Work synchronisieren

## Einführung
Das **WeChat Work** Plugin ermöglicht es Ihnen, Benutzer- und Abteilungsdaten aus WeChat Work zu synchronisieren.

## Eine benutzerdefinierte WeChat Work Anwendung erstellen und konfigurieren
Zuerst müssen Sie im WeChat Work Admin-Bereich eine benutzerdefinierte Anwendung erstellen und die **Unternehmens-ID** (Corp ID), **AgentId** und das **Secret** abrufen.

Weitere Informationen finden Sie unter [Benutzerauthentifizierung - WeChat Work](/auth-verification/auth-wecom/).

## Eine Synchronisierungs-Datenquelle in NocoBase hinzufügen
Gehen Sie zu Benutzer & Berechtigungen - Synchronisieren - Hinzufügen und tragen Sie die abgerufenen Informationen ein.

![](https://static-docs.nocobase.com/202412041251867.png)

## Kontaktsynchronisierung konfigurieren
Navigieren Sie im WeChat Work Admin-Bereich zu Sicherheit und Verwaltung - Verwaltungstools und klicken Sie auf Kontaktsynchronisierung.

![](https://static-docs.nocobase.com/202412041249958.png)

Nehmen Sie die Einstellungen wie abgebildet vor und definieren Sie die vertrauenswürdige IP-Adresse Ihres Unternehmens.

![](https://static-docs.nocobase.com/202412041250776.png)

Anschließend können Sie mit der Synchronisierung der Benutzerdaten fortfahren.

## Den Ereignisempfangsserver einrichten
Wenn Sie möchten, dass Änderungen an Benutzer- und Abteilungsdaten auf Seiten von WeChat Work zeitnah mit Ihrer NocoBase-Anwendung synchronisiert werden, können Sie weitere Einstellungen vornehmen.

Nachdem Sie die vorherigen Konfigurationsinformationen ausgefüllt haben, können Sie die Callback-Benachrichtigungs-URL für Kontakte kopieren.

![](https://static-docs.nocobase.com/202412041256547.png)

Tragen Sie diese in die WeChat Work-Einstellungen ein, rufen Sie den Token und den EncodingAESKey ab und schließen Sie die Konfiguration der NocoBase Benutzer-Synchronisierungs-Datenquelle ab.

![](https://static-docs.nocobase.com/202412041257947.png)