# Benutzerregistrierung mit Prüfung umsetzen

Dieses Dokument stellt zwei Lösungen für eine Registrierungsprüfung vor, die für unterschiedliche Geschäftsszenarien entworfen sind:

- **Lösung 1**: Geeignet für einfache, schnell umsetzbare Prüfprozesse. Sie nutzt die Standard-Registrierungsfunktion und weist allen neuen Benutzern eine rechtelose „Gast"-Rolle zu, die ein Administrator anschließend manuell prüft und aktualisiert.
- **Lösung 2**: Geeignet für flexible, individuell anpassbare Prüfprozesse. Mithilfe einer dedizierten Antragsformular-Tabelle, eines Prüfworkflows und des [Public-Forms-Plugins](https://docs-cn.nocobase.com/handbook/public-forms) deckt sie den gesamten Ablauf von der Antragsabgabe bis zur automatischen Anlage neuer Benutzer ab.

  ![](https://static-docs.nocobase.com/20250219144832.png)

---

## 1. Lösung 1: Rechtelose „Gast"-Rolle nutzen

### 1.0 Anwendungsszenario

Geeignet für Szenarien mit einfachen Anforderungen an die Registrierungsprüfung, in denen die mitgelieferte Registrierungsfunktion verwendet und Benutzer manuell im Backend geprüft werden.

### 1.1 Passwort-Authentifizierung aktivieren und Registrierung erlauben

#### 1.1.1 Authentifizierungsseite aufrufen

Zunächst prüfen wir, ob die Registrierungsfunktion aktiviert ist. Rufen Sie in den Systemeinstellungen die Seite [Benutzerauthentifizierung](https://docs-cn.nocobase.com/handbook/auth/user) auf, die alle Authentifizierungskanäle wie „Anmeldung mit Benutzername/Passwort", [Google-Login](https://docs-cn.nocobase.com/handbook/auth-oidc/example/google) etc. verwaltet (durch Plugins erweiterbar).

![](https://static-docs.nocobase.com/20250208164554.png)

Der Schalter für die Registrierungsfunktion befindet sich hier:
![](https://static-docs.nocobase.com/20250219084856.png)

### 1.2 Standardrolle festlegen (zentral)

#### 1.2.1 „Gast"-Rolle erstellen

Die Registrierung ist standardmäßig aktiviert, doch die Standardrolle entspricht möglicherweise nicht den Anforderungen.

Wir erstellen daher in der Rollenliste zunächst eine „Gast"-Rolle als Standardrolle ohne Rechte. Allen neu registrierten Benutzern wird automatisch diese Rolle zugewiesen.

![](https://static-docs.nocobase.com/20250208163521.png)

### 1.3 Prüfoberfläche für registrierte Benutzer konfigurieren (zentral)

Wechseln Sie in den Bearbeitungsmodus und konfigurieren Sie im Backend einen einfachen Tabellenblock mit der Benutzertabelle, um registrierte Benutzer anzuzeigen und zu verwalten.

![](https://static-docs.nocobase.com/20250208165406.png)

### 1.4 Registrierungsprüfprozess testen und Rolle manuell aktualisieren

- Nach der Registrierung sieht der neue Benutzer standardmäßig eine leere Seite
  ![](https://static-docs.nocobase.com/20250219084449.png)
- Im Verwaltungs-UI weisen Sie Benutzern mit korrekten Antragsdaten manuell die gewünschte Rolle zu, um die Prüfung abzuschließen.
  ![](https://static-docs.nocobase.com/20250219084702.png)

### 1.5 Hinweisseite konfigurieren (optional)

#### 1.5.1 Neue Seite anlegen, z. B. „Registrierung erfolgreich"

> **Optional**: Auf dieser leeren Seite können Sie freundliche Hinweise platzieren, etwa „Ihr Konto wird derzeit geprüft, bitte haben Sie etwas Geduld", um den Status zu kommunizieren.
> ![](https://static-docs.nocobase.com/Pasted%20image%2020250208231631.png)

#### 1.5.2 Berechtigung für die Hinweisseite erteilen

Gehen Sie in die Benutzerverwaltung und weisen Sie der „Gast"-Rolle diese Seite zu. Nach erfolgreicher Registrierung wird der Benutzer automatisch dorthin weitergeleitet.
![](https://static-docs.nocobase.com/20250211223123.png)

### 1.6 Felder der Benutzertabelle erweitern (optional)

> **Optional**: Möchten Sie bei der Registrierung zusätzliche Informationen erfassen, ergänzen Sie entsprechende Felder in der Benutzertabelle (z. B. „Antragsgrund" oder „Einladungscode"). Bei einfacher Registrierungsprüfung können Sie diesen Schritt überspringen.

#### 1.6.1 Antragsfelder hinzufügen

Öffnen Sie die Benutzertabelle und fügen Sie ein Feld zur Erfassung des Antragsgrunds oder Einladungscodes hinzu.
![](https://static-docs.nocobase.com/20250208164321.png)

#### 1.6.2 Felder in der „Benutzerauthentifizierung" aktivieren

![](https://static-docs.nocobase.com/Pasted%20image%2020250219090248.png)

Nach der Konfiguration sehen Sie auf der Login-Seite unter „Konto registrieren" die entsprechenden Felder im Registrierungsformular (sofern als Optionen konfiguriert; andernfalls erscheint das Basisformular).
![](https://static-docs.nocobase.com/20250219090447.png)

#### 1.6.3 Prüfseite um entsprechende Felder ergänzen

Wir ergänzen die Prüfseite um diese beiden Felder, um Rollen in Echtzeit prüfen und ändern zu können.

![](https://static-docs.nocobase.com/20250208165622.png)

---

## 2. Lösung 2: Registrierung schließen und Prüf-Zwischentabelle einführen

### 2.0 Anwendungsszenario

Geeignet für Szenarien mit flexiblerem, individuell anpassbarem Prüfprozess.

Diese Lösung deckt mit einer eigenständigen Antragstabelle, Workflow-Konfiguration und dem [Public-Forms-Plugin](https://docs-cn.nocobase.com/handbook/public-forms) den gesamten Ablauf von der Antragsabgabe bis zur automatischen Benutzeranlage ab. Die Kernschritte sichern die Grundfunktionen, weitere Erweiterungen sind je nach Bedarf möglich.

### 2.1 Vorbereitung (zentral)

#### 2.1.1 Antragstabelle entwerfen

##### 2.1.1.1 Tabelle „Antragsdaten" anlegen

- **Tabelle erstellen**
  Legen Sie im NocoBase-Backend eine neue Tabelle zur Speicherung der Registrierungsanträge an.
- **Felder konfigurieren**
  Fügen Sie folgende Felder mit korrekten Typen und Beschreibungen hinzu:


  | Field display name     | Field name         | Field interface  | Beschreibung                                       |
  | ---------------------- | ------------------ | ---------------- | -------------------------------------------------- |
  | **ID**                 | id                 | Integer          | Automatisch generierte eindeutige ID               |
  | **Username**           | username           | Single line text | Benutzername des Antragstellers                    |
  | **Email**              | email              | Email            | E-Mail-Adresse des Antragstellers                  |
  | **Phone**              | phone              | Phone            | Telefonnummer des Antragstellers                   |
  | **Full Name**          | full_name          | Single line text | Vollständiger Name des Antragstellers              |
  | **Application Reason** | application_reason | Long text        | Begründung des Antrags                             |
  | **User Type**          | user_type          | Single select    | Geplanter Benutzertyp (z. B. E-Mail, offen)        |
  | **Status**             | status             | Single select    | Status des Antrags (offen, angenommen, abgelehnt)  |
  | **Initial Password**   | initial_password   | Single line text | Initialpasswort (Standard: nocobase)               |
  | **Created at**         | createdAt          | Created at       | Zeitpunkt der Erstellung                           |
  | **Created by**         | createdBy          | Created by       | Ersteller des Datensatzes                          |
  | **Last updated at**    | updatedAt          | Last updated at  | Zeitpunkt der letzten Änderung                     |
  | **Last updated by**    | updatedBy          | Last updated by  | Letzter Bearbeiter                                 |
- **Tabellenstruktur prüfen**
  Vergleichen Sie die Konfiguration mit der folgenden Abbildung:
  ![](https://static-docs.nocobase.com/20250208145543.png)

##### 2.1.1.2 Daten erfassen und anzeigen

- **Prüfoberfläche konfigurieren**
  Konfigurieren Sie im Hauptbereich eine „Antragsprüfung"-Oberfläche zur Anzeige eingereichter Anträge.
- **Testdaten erfassen**
  Erfassen Sie im Verwaltungs-UI Testdaten, um die korrekte Anzeige sicherzustellen.
  ![](https://static-docs.nocobase.com/20250208151429.png)

### 2.2 Workflow-Konfiguration

In diesem Abschnitt konfigurieren wir den Workflow, der nach erfolgter Prüfung automatisch neue Benutzer anlegt.

#### 2.2.1 Prüfworkflow erstellen

##### 2.2.1.1 Neuen Workflow anlegen

- **Workflow-Oberfläche aufrufen**
  Rufen Sie im Backend die Workflow-Konfiguration auf und wählen Sie „Neuen Workflow anlegen".
- **Trigger-Ereignis auswählen**
  Wählen Sie [„Post-Action Event"](https://docs-cn.nocobase.com/handbook/workflow/triggers/post-action) oder [„Pre-Action Event"](https://docs-cn.nocobase.com/handbook/workflow/triggers/pre-action). Wir nehmen hier das Pre-Action Event.
- **Workflow-Knoten konfigurieren**
  Legen Sie einen „Benutzer hinzufügen"-Knoten an, der die Formulardaten in einen neuen Benutzer überführt, mit Feld-Mapping und Verarbeitungslogik.
  Siehe Abbildung:
  ![](https://static-docs.nocobase.com/20250208153202.png)

#### 2.2.2 Prüf-Buttons im Formular einrichten

##### 2.2.2.1 Buttons „Annehmen" und „Ablehnen" hinzufügen

Fügen Sie im Antragsformular die Buttons „Prüfung annehmen" und „Prüfung ablehnen" hinzu.
![](https://static-docs.nocobase.com/20250208153302.png)

##### 2.2.2.2 Funktionen der Buttons konfigurieren

- **„Prüfung annehmen" konfigurieren**
  - An den eben erstellten Workflow binden;
  - Beim Senden den Wert des Feldes [Status] auf „angenommen" setzen.
    Siehe Abbildung:
    ![](https://static-docs.nocobase.com/20250208153429.png)
    ![](https://static-docs.nocobase.com/20250208153409.png)
- **„Prüfung ablehnen" konfigurieren**
  - Beim Senden den Wert des Feldes [Status] auf „abgelehnt" setzen.

##### 2.2.2.3 Linkage-Regeln für Buttons festlegen

Um Mehrfachklicks zu vermeiden, fügen Sie eine Linkage-Regel hinzu: Buttons werden ausgeblendet, sobald [Status] nicht mehr „offen" ist.
Siehe Abbildung:
![](https://static-docs.nocobase.com/20250208153749.png)

### 2.3 Public-Forms-Plugin aktivieren und konfigurieren

Mit dem [Public-Forms-Plugin](https://docs-cn.nocobase.com/handbook/public-forms) können Benutzer Anträge über eine öffentliche Seite stellen.

#### 2.3.1 Plugin aktivieren

##### 2.3.1.1 Plugin aktivieren

- **Plugin-Verwaltung öffnen**
  Suchen Sie im Backend das Plugin „Public Forms" und aktivieren Sie es.
  Siehe Abbildung:
  ![](https://static-docs.nocobase.com/20250208154258.png)

#### 2.3.2 Public Form anlegen und konfigurieren

##### 2.3.2.1 Public Form erstellen

- **Formular anlegen**
  Erstellen Sie im Backend ein Public Form für die Antragstellung.
- **Formularelemente konfigurieren**
  Fügen Sie nötige Felder (Benutzername, E-Mail, Telefon etc.) hinzu und legen Sie Validierungsregeln fest.
  Siehe Abbildung:
  ![](https://static-docs.nocobase.com/20250208155044.png)

#### 2.3.3 Plugin aktivieren und konfigurieren (zentral)

##### 2.3.3.1 Public Form testen

- **Seite öffnen**
  Rufen Sie die öffentliche Formularseite auf, füllen Sie das Formular aus und senden Sie es ab.
- **Funktion verifizieren**
  Prüfen Sie, ob die Daten korrekt in der Antragstabelle landen und nach der Prüfung automatisch ein neuer Benutzer angelegt wird.
  Beispiel:
  ![](https://static-docs.nocobase.com/202502191351-register2.gif)

### 2.4 Erweiterungen (optional)

Nach Abschluss des Basisprozesses können Sie weitere Funktionen ergänzen:

#### 2.4.1 Registrierung per Einladungscode

- **Funktion**: Über Einladungscodes Reichweite und Anzahl der Registrierungen begrenzen.
- **Vorgehen**: Ein Einladungscodefeld zur Antragstabelle hinzufügen und im „Pre-Action Event" vor dem Submit prüfen und gegebenenfalls abbrechen.

#### 2.4.2 Automatische E-Mail-Benachrichtigung

- **Funktion**: Automatischer Versand von Prüfergebnis- und Registrierungsmails.
- **Vorgehen**: Mit dem E-Mail-Knoten von NocoBase im Workflow den E-Mail-Versand integrieren.

---

Bei Fragen können Sie jederzeit das [NocoBase Community-Forum](https://forum.nocobase.com) besuchen oder die [offizielle Dokumentation](https://docs-cn.nocobase.com) konsultieren. Wir hoffen, dieser Leitfaden hilft Ihnen, die Registrierungsprüfung gemäß Ihren Anforderungen umzusetzen und flexibel zu erweitern. Viel Erfolg bei Ihrem Projekt!
