# Kapitel 5: Benutzer und Berechtigungen — Wer darf was sehen

Im vorherigen Kapitel haben wir Formular und Detailansicht fertiggestellt; das Ticket-System kann nun ordnungsgemäß Daten erfassen und anzeigen. Allerdings gibt es noch ein Problem — alle Benutzer sehen nach dem Login dasselbe. Mitarbeiter, die nur Tickets einreichen, sehen die Verwaltungsseiten; Techniker können Kategorien löschen … das geht so nicht.

In diesem Kapitel rüsten wir das System mit einer „Zutrittskontrolle" aus: Wir erstellen [Rollen](/users-permissions/acl/role), konfigurieren [Menü-Berechtigungen](/users-permissions/acl/permissions) und [Datenbereiche](/users-permissions/acl/permissions). So sehen **unterschiedliche Personen unterschiedliche Menüs und arbeiten mit unterschiedlichen Daten**.

## 5.1 [Rollen](/users-permissions/acl/role) (Roles) verstehen

In NocoBase ist eine **Rolle eine Sammlung von [Berechtigungen](/users-permissions/acl/role)**. Sie müssen nicht jedem Benutzer einzeln Berechtigungen zuweisen, sondern definieren zunächst einige Rollen und ordnen die Benutzer den entsprechenden Rollen zu.

NocoBase liefert nach der Installation drei Standardrollen mit:

- **Root**: Super-Administrator, hat alle Berechtigungen, nicht löschbar
- **Admin**: Administrator, hat standardmäßig die Berechtigung zur Konfiguration der Oberfläche
- **Member**: Normales Mitglied, mit standardmäßig wenigen Berechtigungen

Diese drei integrierten Rollen reichen jedoch nicht aus. Unser Ticket-System erfordert eine feinere Aufteilung, daher erstellen wir als Nächstes drei eigene Rollen.

## 5.2 Drei Rollen erstellen

Öffnen Sie das Einstellungsmenü oben rechts und gehen Sie zu **Benutzer und Berechtigungen → Rollen-Verwaltung**.

Klicken Sie auf **Rolle hinzufügen** und erstellen Sie nacheinander:

| Rollenname | Rollenkennung | Beschreibung |
|---------|---------|------|
| Administrator | admin-helpdesk | Sieht alle Tickets, verwaltet Kategorien, weist Zuständige zu |
| Techniker | technician | Sieht nur die ihm zugewiesenen Tickets, kann sie bearbeiten und schließen |
| Standardbenutzer | user | Kann nur Tickets einreichen und sieht nur eigene Einträge |

![05-roles-and-permissions-2026-03-13-19-03-14](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-03-14.png)

> Die **Rollenkennung** ist die systeminterne, eindeutige ID. Sie kann nach der Erstellung nicht mehr geändert werden; wir empfehlen englische Kleinbuchstaben. Der Rollenname lässt sich jederzeit anpassen.

![05-roles-and-permissions-2026-03-13-18-57-47](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-18-57-47.png)

Anschließend sollten in der Rollenliste die drei neu erstellten Rollen erscheinen.


## 5.3 Menü-Berechtigungen konfigurieren

Die Rollen sind angelegt; nun teilen wir dem System mit, welche Menüs jede Rolle sehen darf.

Klicken Sie auf eine Rolle, um die Berechtigungs-Konfigurationsseite zu öffnen, und gehen Sie zum Tab **Menüzugriff**. Dort werden alle Menü-Einträge des Systems aufgelistet. Eine aktivierte Checkbox bedeutet Zugriff erlaubt, eine deaktivierte verbirgt den Eintrag.

**Administrator (admin-helpdesk)**: alles aktivieren
- Ticket-Verwaltung, Kategorie-Verwaltung, Dashboard — alles sichtbar

**Techniker (technician)**: teilweise aktivieren
- ✅ Ticket-Verwaltung
- ✅ Dashboard
- ❌ Kategorie-Verwaltung (Techniker müssen keine Kategorien verwalten)

**Standardbenutzer (user)**: minimale Berechtigungen
- ✅ Ticket-Verwaltung (sieht nur eigene Tickets)
- ❌ Kategorie-Verwaltung
- ❌ Dashboard

![05-roles-and-permissions-2026-03-13-19-09-11](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-09-11.png)

> **Tipp**: NocoBase bietet die praktische Einstellung „Neuen Menü-Einträgen standardmäßig Zugriff erlauben". Falls Sie nicht jedes Mal neu hinzugefügte Seiten manuell aktivieren möchten, können Sie diese Option für die Administratorrolle einschalten. Für Standardbenutzer empfiehlt es sich, sie auszuschalten.

## 5.4 Datenberechtigungen konfigurieren

Menü-Berechtigungen regeln, „ob die Seite betreten werden darf". Datenberechtigungen regeln, „welche Daten innerhalb der Seite sichtbar sind".

Schlüsselbegriff: **[Datenbereich](/users-permissions/acl/permissions) (Data Scope)**.

Wechseln Sie in der Berechtigungs-Konfiguration einer Rolle zum Tab **[Collection](/data-sources/data-modeling/collection)-Aktionsberechtigungen**. Suchen Sie unsere Collection „Tickets" und öffnen Sie deren Einzelkonfiguration.

![05-roles-and-permissions-2026-03-13-19-51-06](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-51-06.png)

### Standardbenutzer: Sieht nur eigene Tickets

1. Suchen Sie die Berechtigung **Anzeigen** der Collection „Tickets".
2. Datenbereich auswählen → **Eigene Daten**.
3. Damit sehen Standardbenutzer nur Tickets, deren „Ersteller sie selbst sind". (Hinweis: Standardmäßig wird das Field „Ersteller" verwendet, nicht das Field „Einreicher". Das lässt sich aber anpassen.)

Setzen Sie analog die Berechtigungen „Bearbeiten" und „Löschen" auf **Eigene Daten** (oder geben Sie schlicht keine Löschberechtigung).

![05-roles-and-permissions-2026-03-13-19-53-02](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-53-02.png)


Zur globalen Konfiguration: Wenn Sie nur die Tickets-Collection konfigurieren, werden andere Daten und Konfigurationen (z. B. Kategorien-Collection, Zuständige) möglicherweise nicht sichtbar. Da unser System derzeit relativ einfach ist, aktivieren wir global „Alle Daten anzeigen" und konfigurieren Berechtigungen einzeln nur für datensensitive Tabellen.

![05-roles-and-permissions-2026-03-13-19-57-24](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-57-24.png)


### Techniker: Sieht nur die ihm zugewiesenen Tickets

1. Suchen Sie die Berechtigung **Anzeigen** der Collection „Tickets".
2. Datenbereich auswählen → **Eigene Daten**.
3. Wichtig: NocoBases Option „Eigene Daten" filtert standardmäßig nach „Ersteller". Wenn Sie nach „Zuständiger" filtern möchten, können Sie dies in den globalen [Aktionsberechtigungen](/users-permissions/acl/permissions) weiter justieren oder im Frontend über die **Filterbedingungen des Daten-[Blocks](/interface-builder/blocks)** umsetzen.

![05-roles-and-permissions-2026-03-13-20-01-54](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-20-01-54.png)

> **Praxistipp**: Sie können am Tabellen-Block auch eine Standardfilterbedingung als zusätzliche Berechtigungssteuerung setzen, etwa „Zuständiger = Aktueller Benutzer". Da diese Seitenkonfiguration jedoch global wirkt, ist auch der Administrator betroffen. Ein Kompromiss: „Zuständiger = Aktueller Benutzer **oder** Einreicher = Aktueller Benutzer" deckt Standardbenutzer und Techniker ab; benötigt der Administrator eine globale Sicht, legen Sie eine separate Seite ohne Filter an.

![05-roles-and-permissions-2026-03-13-22-21-34](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-21-34.png)

### Administrator: Sieht alle Daten

Setzen Sie den Datenbereich der Administratorrolle auf **Alle Daten** und aktivieren Sie alle Aktionen. Einfach und direkt.

![05-roles-and-permissions-2026-03-13-21-45-14](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-21-45-14.png)

## 5.5 Aktion „Ticket zuweisen"

Bevor wir die Berechtigungen testen, fügen wir der Ticket-Liste eine praktische Funktion hinzu: **Zuständigen zuweisen**. Administratoren können Tickets direkt aus der Liste an einen Techniker zuweisen, ohne in die Bearbeitungsansicht zu wechseln und mehrere Felder zu ändern.

Die Umsetzung ist einfach — wir fügen in der Aktionsspalte der Tabelle einen eigenen Pop-up-Button hinzu:

1. Wechseln Sie in den UI-Editor-Modus, klicken Sie in der Aktionsspalte der Ticket-Tabelle auf **„+"** und fügen Sie eine **„Pop-up"**-Aktion hinzu.

![05-roles-and-permissions-2026-03-14-13-57-31](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-13-57-31.png)

2. Ändern Sie den Button-Titel auf **„Zuweisen"** (in den Button-Optionen den Titel anpassen).

![05-roles-and-permissions-2026-03-14-13-59-22](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-13-59-22.png)


Da es nur um eine kleine Zuweisungsinformation geht, ist ein einfaches Pop-up passender als ein Drawer. Öffnen Sie oben rechts die Pop-up-Einstellungen, wählen Sie Dialog (schmal) > Bestätigen.
![05-roles-and-permissions-2026-03-14-14-08-16](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-08-16.png)


3. Klicken Sie auf den Button „Zuweisen", um das Pop-up zu öffnen, dann **„Block erstellen → Daten-Block → Formular (Edit)"** und wählen Sie die aktuelle Collection.
4. Aktivieren Sie im Formular nur das eine Field **„Zuständiger"** und setzen Sie es in den Field-Optionen auf **Pflichtfeld**.
5. Fügen Sie den Action-Button **„Submit"** hinzu.

![05-roles-and-permissions-2026-03-14-14-10-50](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-10-50.png)

Damit klickt der Administrator in der Ticket-Liste auf „Zuweisen", es erscheint ein minimalistisches Formular, und nach Auswahl eines Zuständigen wird per Submit gespeichert. Schnell, präzise — andere Felder werden nicht versehentlich geändert.

### Sichtbarkeit des Buttons mit Linkage Rule steuern

Den Button „Zuweisen" benötigen nur Administratoren; Standardbenutzer und Techniker werden durch ihn nur verwirrt. Mit einer **Linkage Rule** können wir die Sichtbarkeit des Buttons je nach Rolle des aktuellen Benutzers steuern:

1. Klicken Sie im UI-Editor-Modus auf die Optionen des Buttons „Zuweisen" und suchen Sie **„Linkage rules"**.
2. Fügen Sie eine Regel mit folgender Bedingung hinzu: **Aktueller Benutzer / Rolle / Rollenname** ungleich **Administrator** (also der Anzeigename der Rolle admin-helpdesk).
3. Aktion bei erfüllter Bedingung: Button **ausblenden**.

So sehen nur Benutzer mit der Administratorrolle den Button „Zuweisen"; bei anderen Rollen wird er nach dem Login automatisch ausgeblendet.

![05-roles-and-permissions-2026-03-14-14-17-37](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-17-37.png)

## 5.6 Testbenutzer anlegen und ausprobieren

Die Berechtigungen sind konfiguriert; prüfen wir das Ganze in der Praxis.

Gehen Sie zur **Benutzerverwaltung** (Einstellungen oder die zuvor angelegte Benutzerverwaltungsseite) und legen Sie drei Testbenutzer an:

| Benutzername | Rolle |
|-------|------|
| Alice | Administrator (admin-helpdesk) |
| Bob | Techniker (technician) |
| Charlie | Standardbenutzer (user) |

![05-roles-and-permissions-2026-03-13-22-23-47](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-23-47.png)

Melden Sie sich nach der Erstellung mit jedem Konto an und prüfen Sie zwei Punkte:

**1. Werden die Menüs wie erwartet angezeigt?**
- Alice → sieht alle Menüs

![05-roles-and-permissions-2026-03-14-14-19-29](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-19-29.png)

- Bob → sieht nur Ticket-Verwaltung und Dashboard

![05-roles-and-permissions-2026-03-13-22-26-50](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-26-50.png)

- Charlie → sieht nur „Meine Tickets"

![05-roles-and-permissions-2026-03-13-22-30-57](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-30-57.png)

**2. Werden die Daten wie erwartet gefiltert?**
- Erstellen Sie als Alice einige Tickets und weisen Sie sie verschiedenen Zuständigen zu.
- Wechseln Sie zu Bob → sieht nur die ihm zugewiesenen Tickets.
- Wechseln Sie zu Charlie → sieht nur die selbst eingereichten Tickets.

Cool, oder? Ein und dasselbe System zeigt unterschiedlichen Benutzern völlig unterschiedliche Inhalte. Das ist die Macht der Berechtigungen.

## Zusammenfassung

In diesem Kapitel haben wir das Berechtigungssystem unseres Ticket-Systems aufgebaut:

- **3 Rollen**: Administrator, Techniker, Standardbenutzer
- **Menü-Berechtigungen**: Steuern, welche Seiten jede Rolle betreten darf
- **Datenberechtigungen**: Steuern über den Datenbereich, welche Daten jede Rolle sehen darf
- **Test und Verifizierung**: Mit verschiedenen Konten anmelden, um die Berechtigungen zu prüfen

Damit hat unser Ticket-System bereits Hand und Fuß — es kann erfassen, anzeigen und rollenbasiert Zugriffe steuern. Allerdings sind alle Aktionen noch manuell.

## Vorschau auf das nächste Kapitel

Im nächsten Kapitel lernen wir **Workflows** kennen — damit das System für uns automatisch arbeitet. Zum Beispiel: Nach Einreichung eines Tickets wird automatisch der Zuständige benachrichtigt, oder bei Statusänderungen wird automatisch ein Log erzeugt.

## Verwandte Ressourcen

- [Benutzerverwaltung](/users-permissions/user) — Detaillierte Erläuterung zur Benutzerverwaltung
- [Rollen und Berechtigungen](/users-permissions/acl/role) — Beschreibung der Rollenkonfiguration
- [Datenbereich](/users-permissions/acl/permissions) — Datensatzbasierte Berechtigungssteuerung
