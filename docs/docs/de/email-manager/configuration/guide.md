---
pkg: "@nocobase/plugin-email-manager"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Konfigurationsprozess

## Überblick
Bevor Benutzer ihre E-Mail-Konten mit NocoBase verbinden können, müssen Administratoren nach der Aktivierung des E-Mail-Plugins zunächst die notwendigen Konfigurationen vornehmen. Aktuell wird nur die autorisierte Anmeldung für Outlook- und Gmail-Konten unterstützt; eine direkte Anmeldung mit Microsoft- und Google-Konten ist derzeit nicht möglich.

Der Kern der Konfiguration liegt in den Authentifizierungseinstellungen für die API-Aufrufe des E-Mail-Dienstanbieters. Administratoren müssen die folgenden Schritte ausführen, um die korrekte Funktion des Plugins sicherzustellen:

1.  **Authentifizierungsinformationen vom Dienstanbieter beziehen**  
    -   Melden Sie sich bei der Entwicklerkonsole des E-Mail-Dienstanbieters an (z. B. Google Cloud Console oder Microsoft Azure Portal).  
    -   Erstellen Sie eine neue Anwendung oder ein Projekt und aktivieren Sie den Gmail- oder Outlook-E-Mail-API-Dienst.  
    -   Besorgen Sie sich die entsprechende Client ID und das Client Secret.  
    -   Konfigurieren Sie die Redirect URI so, dass sie mit der Callback-Adresse des NocoBase-Plugins übereinstimmt.  

2.  **Konfiguration des E-Mail-Dienstanbieters**  
    -   Navigieren Sie zur Konfigurationsseite des E-Mail-Plugins.  
    -   Geben Sie die erforderlichen API-Authentifizierungsinformationen ein, einschließlich Client ID und Client Secret, um eine korrekte Autorisierung mit dem E-Mail-Dienstanbieter zu gewährleisten.

3.  **Autorisierte Anmeldung**  
    -   Benutzer melden sich über das OAuth-Protokoll bei ihren E-Mail-Konten an.  
    -   Das Plugin generiert und speichert automatisch das Autorisierungstoken des Benutzers für nachfolgende API-Aufrufe und E-Mail-Operationen.

4.  **E-Mail-Konten verbinden**  
    -   Nach erfolgreicher Autorisierung wird das E-Mail-Konto des Benutzers mit NocoBase verbunden.  
    -   Das Plugin synchronisiert die E-Mail-Daten des Benutzers und bietet Funktionen zum Verwalten, Senden und Empfangen von E-Mails.

5.  **Nutzung der E-Mail-Funktionen**  
    -   Benutzer können E-Mails direkt innerhalb der Plattform anzeigen, verwalten und senden.  
    -   Alle Operationen werden über die API-Aufrufe des E-Mail-Dienstanbieters ausgeführt, was eine Echtzeit-Synchronisierung und effiziente Übertragung gewährleistet.  

Durch den oben beschriebenen Prozess bietet das E-Mail-Plugin von NocoBase den Benutzern effiziente und sichere E-Mail-Verwaltungsdienste. Sollten Sie während der Konfiguration auf Probleme stoßen, konsultieren Sie bitte die entsprechende Dokumentation oder wenden Sie sich an das technische Support-Team.

## Plugin-Konfiguration

### E-Mail-Plugin aktivieren

1.  Gehen Sie zur Plugin-Verwaltungsseite.
2.  Suchen Sie das Plugin "Email manager" und aktivieren Sie es.

### Konfiguration des E-Mail-Dienstanbieters

Nachdem das E-Mail-Plugin aktiviert wurde, können Sie die E-Mail-Dienstanbieter konfigurieren. Derzeit werden Google- und Microsoft-E-Mail-Dienste unterstützt. Klicken Sie in der oberen Leiste auf „Einstellungen“ -> „E-Mail-Einstellungen“, um zur Einstellungsseite zu gelangen.

![](https://static-docs.nocobase.com/mail-1733818617187.png)

![](https://static-docs.nocobase.com/mail-1733818617514.png)

Für jeden Dienstanbieter müssen Sie die Client ID und das Client Secret eingeben. In den folgenden Abschnitten wird detailliert beschrieben, wie Sie diese beiden Parameter erhalten.