# Custom Request

## Einführung

Wenn in einem Prozess externe Schnittstellen oder Drittanbieterdienste aufgerufen werden müssen, können Sie über Custom Request eine eigene HTTP-Anfrage auslösen. Typische Anwendungsfälle:

* Aufruf von externen System-APIs (z. B. CRM, KI-Dienste)
* Abruf entfernter Daten zur Weiterverarbeitung in nachfolgenden Prozessschritten
* Übermittlung von Daten an Drittanbietersysteme (Webhook, Benachrichtigungen usw.)
* Auslösen automatisierter Abläufe in internen oder externen Diensten

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_07_PM.png)


## Aktionskonfiguration

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_09_PM.png)

In Schaltflächeneinstellungen -> Custom Request können folgende Inhalte konfiguriert werden:

* HTTP method: HTTP-Anfragemethode wie GET, POST, PUT, DELETE usw.
* URL: Zieladresse der Anfrage; kann eine vollständige Schnittstellen-URL sein oder dynamisch über Variablen zusammengesetzt werden.
* Headers: Header-Informationen der Anfrage, z. B. zur Übergabe von Authentifizierungsdaten oder API-Konfiguration wie Authorization, Content-Type usw.
* Parameters: URL-Query-Parameter, üblicherweise bei GET-Anfragen verwendet.
* Body: Inhalt des Anfragekörpers, üblicherweise bei POST, PUT etc., kann JSON, Formulardaten o. ä. enthalten.
* Timeout config: Konfiguration des Anfrage-Timeouts, begrenzt die maximale Wartezeit, um zu verhindern, dass der Prozess lange blockiert wird.
* Response type: Datentyp der Antwort.
* JSON: Wenn die Schnittstelle JSON-Daten zurückgibt, wird das Ergebnis in den Prozesskontext injiziert und kann in nachfolgenden Schritten über `ctx.steps` ausgelesen werden.
* Stream: Wenn die Schnittstelle einen Datenstrom zurückgibt, wird nach erfolgreicher Anfrage automatisch ein Datei-Download ausgelöst.
* Access control: Zugriffssteuerung, beschränkt, welche Rollen diesen Anfrage-Schritt auslösen können, um die Sicherheit des API-Aufrufs zu gewährleisten.

## Weitere Aktions-Einstellungen

Neben den Anfrageeinstellungen unterstützt die Custom-Request-Schaltfläche auch diese gängigen Konfigurationen:

- [Schaltfläche bearbeiten](/interface-builder/actions/action-settings/edit-button): Titel, Stil und Symbol der Schaltfläche konfigurieren;
- [Aktions-Verknüpfungsregeln](/interface-builder/actions/action-settings/linkage-rule): Sichtbarkeit, Deaktivierung usw. der Schaltfläche dynamisch nach Bedingungen steuern;
- [Doppelte Bestätigung](/interface-builder/actions/action-settings/double-check): Nach dem Klick zuerst ein Bestätigungsdialog, bevor die Anfrage tatsächlich gesendet wird.
