---
pkg: "@nocobase/plugin-client"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



pkg: "@nocobase/plugin-client"
---

# Routen-Manager

## Einführung

Der Routen-Manager ist ein Werkzeug zur Verwaltung der Routen der Hauptseite des Systems und unterstützt sowohl `Desktop`- als auch `Mobilgeräte`. Routen, die Sie mit dem Routen-Manager erstellen, werden synchron im Menü angezeigt (Sie können konfigurieren, dass sie nicht im Menü erscheinen). Umgekehrt gilt: Menüpunkte, die Sie im Seitenmenü hinzufügen, werden ebenfalls synchron in der Liste des Routen-Managers angezeigt.

![20250107115449](https://static-docs.nocobase.com/20250107115449.png)

## Benutzerhandbuch

### Routentypen

Das System unterstützt vier Routentypen:

- Gruppe (group): Dient zur Gruppierung und Verwaltung von Routen und kann Unterrouten enthalten.
- Seite (page): Eine interne Systemseite.
- Tab (tab): Ein Routentyp zum Wechseln zwischen Tabs innerhalb einer Seite.
- Link (link): Ein interner oder externer Link, der direkt zur konfigurierten Linkadresse springt.

### Route hinzufügen

Klicken Sie auf die Schaltfläche „Add new“ oben rechts, um eine neue Route zu erstellen:

1.  Wählen Sie den Routentyp (Type) aus.
2.  Geben Sie den Routentitel (Title) ein.
3.  Wählen Sie das Routen-Icon (Icon) aus.
4.  Legen Sie fest, ob die Route im Menü angezeigt werden soll (Show in menu).
5.  Legen Sie fest, ob Tab-Seiten aktiviert werden sollen (Enable page tabs).
6.  Bei Routen vom Typ „Seite“ generiert das System automatisch einen eindeutigen Routenpfad (Path).

![20250124131803](https://static-docs.nocobase.com/20250124131803.png)

### Routen-Aktionen

Jeder Routeneintrag unterstützt die folgenden Aktionen:

- Unterroute hinzufügen (Add child): Fügen Sie eine Unterroute hinzu.
- Bearbeiten (Edit): Bearbeiten Sie die Routenkonfiguration.
- Anzeigen (View): Zeigen Sie die Routenseite an.
- Löschen (Delete): Löschen Sie die Route.

### Massenaktionen

Die obere Symbolleiste bietet die folgenden Massenaktionen:

- Aktualisieren (Refresh): Aktualisieren Sie die Routenliste.
- Löschen (Delete): Löschen Sie die ausgewählten Routen.
- Im Menü ausblenden (Hide in menu): Blenden Sie die ausgewählten Routen im Menü aus.
- Im Menü anzeigen (Show in menu): Zeigen Sie die ausgewählten Routen im Menü an.

### Routen filtern

Verwenden Sie die „Filter“-Funktion oben, um die Routenliste nach Bedarf zu filtern.

:::info{title=Hinweis}
Änderungen an den Routenkonfigurationen wirken sich direkt auf die Navigationsmenüstruktur des Systems aus. Bitte gehen Sie vorsichtig vor und stellen Sie die Korrektheit der Routenkonfigurationen sicher.
:::