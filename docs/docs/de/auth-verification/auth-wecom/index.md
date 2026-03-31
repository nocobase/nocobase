---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Authentifizierung: WeCom

## Einführung

Das **WeCom**-Plugin ermöglicht es Benutzern, sich mit ihren WeCom-Konten bei NocoBase anzumelden.

## Plugin aktivieren

![](https://static-docs.nocobase.com/202406272056962.png)

## Eine benutzerdefinierte WeCom-Anwendung erstellen und konfigurieren

Gehen Sie in die WeCom-Administrationskonsole, um eine benutzerdefinierte Anwendung zu erstellen.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

Klicken Sie auf die Anwendung, um zur Detailseite zu gelangen, scrollen Sie nach unten und klicken Sie auf „WeCom-autorisierte Anmeldung“.

![](https://static-docs.nocobase.com/202406272104655.png)

Legen Sie die autorisierte Callback-Domain auf die Domain Ihrer NocoBase-Anwendung fest.

![](https://static-docs.nocobase.com/202406272105662.png)

Kehren Sie zur Detailseite der Anwendung zurück und klicken Sie auf „Web-Autorisierung und JS-SDK“.

![](https://static-docs.nocobase.com/202406272107063.png)

Legen und überprüfen Sie die Callback-Domain für die OAuth2.0-Web-Autorisierungsfunktion der Anwendung.

![](https://static-docs.nocobase.com/202406272107899.png)

Klicken Sie auf der Detailseite der Anwendung auf „Vertrauenswürdige Unternehmens-IP“.

![](https://static-docs.nocobase.com/202406272108834.png)

Konfigurieren Sie die IP-Adresse der NocoBase-Anwendung.

![](https://static-docs.nocobase.com/202406272109805.png)

## Anmeldeinformationen aus der WeCom-Administrationskonsole abrufen

Kopieren Sie in der WeCom-Administrationskonsole unter „Mein Unternehmen“ die „Unternehmens-ID“.

![](https://static-docs.nocobase.com/202406272111637.png)

Gehen Sie in der WeCom-Administrationskonsole unter „Anwendungsverwaltung“ zur Detailseite der im vorherigen Schritt erstellten Anwendung und kopieren Sie die AgentId und das Secret.

![](https://static-docs.nocobase.com/202406272122322.png)

## WeCom-Authentifizierung in NocoBase hinzufügen

Gehen Sie zur Verwaltungsseite für Benutzerauthentifizierungs-Plugins.

![](https://static-docs.nocobase.com/202406272115044.png)

Hinzufügen - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### Konfiguration

![](https://static-docs.nocobase.com/202412041459250.png)

| Option                                                                                                | Beschreibung                                                                                                                                                                                   | Versionsanforderung |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Wenn eine Telefonnummer keinem bestehenden Benutzer entspricht, <br />soll ein neuer Benutzer automatisch erstellt werden? | Legt fest, ob automatisch ein neuer Benutzer erstellt werden soll, wenn eine Telefonnummer keinem bestehenden Benutzer entspricht. | -                   |
| Unternehmens-ID                                                                                            | Die Unternehmens-ID, die Sie aus der WeCom-Administrationskonsole erhalten.                                                                                                                                            | -                   |
| AgentId                                                                                               | Wird aus der Konfiguration der benutzerdefinierten Anwendung in der WeCom-Administrationskonsole abgerufen.                                                                                                          | -                   |
| Secret                                                                                                | Wird aus der Konfiguration der benutzerdefinierten Anwendung in der WeCom-Administrationskonsole abgerufen.                                                                                                          | -                   |
| Origin                                                                                                | Die Domain der aktuellen Anwendung.                                                                                                                                                               | -                   |
| Weiterleitungslink der Workbench-Anwendung                                                                   | Der Anwendungspfad, zu dem nach erfolgreicher Anmeldung weitergeleitet wird.                                                                                                                                 | `v1.4.0`            |
| Automatische Anmeldung                                                                                       | Automatische Anmeldung, wenn der Anwendungslink im WeCom-Browser geöffnet wird. Wenn mehrere WeCom-Authentifikatoren konfiguriert sind, kann nur einer diese Option aktiviert haben.                          | `v1.4.0`            |
| Homepage-Link der Workbench-Anwendung                                                               | Der Homepage-Link der Workbench-Anwendung.                                                                                                                                                          | -                   |

## WeCom-Anwendungshomepage konfigurieren

:::info
Für Versionen `v1.4.0` und höher kann der Homepage-Link der Anwendung, wenn die Option „Automatische Anmeldung“ aktiviert ist, vereinfacht werden zu: `https://<url>/<path>`, zum Beispiel `https://example.nocobase.com/admin`.

Sie können auch separate Links für Mobil- und Desktop-Geräte konfigurieren, zum Beispiel `https://example.nocobase.com/m` und `https://example.nocobase.com/admin`.
:::

Gehen Sie in die WeCom-Administrationskonsole und fügen Sie den kopierten Homepage-Link der Workbench-Anwendung in das Adressfeld der Anwendungshomepage der entsprechenden Anwendung ein.

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## Anmeldung

Besuchen Sie die Anmeldeseite und klicken Sie auf die Schaltfläche unter dem Anmeldeformular, um die Anmeldung über einen Drittanbieter zu starten.

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
Aufgrund der Berechtigungsbeschränkungen von WeCom für sensible Informationen wie Telefonnummern kann die Autorisierung nur innerhalb des WeCom-Clients abgeschlossen werden. Wenn Sie sich zum ersten Mal mit WeCom anmelden, befolgen Sie bitte die unten stehenden Schritte, um die erste Anmeldeautorisierung innerhalb des WeCom-Clients abzuschließen.
:::

## Erstmalige Anmeldung

Gehen Sie vom WeCom-Client zur Workbench, scrollen Sie nach unten und klicken Sie auf die Anwendung, um die zuvor konfigurierte Homepage aufzurufen. Dadurch wird die erste Autorisierung abgeschlossen. Danach können Sie WeCom verwenden, um sich bei Ihrer NocoBase-Anwendung anzumelden.

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />