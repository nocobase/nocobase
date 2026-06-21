# Kapitel 2: Aufgabenverwaltungssystem entwerfen

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113593597037138&bvid=BV1oCi2YdEAU&cid=27174896249&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Ein Aufgabenverwaltungssystem zu entwerfen klingt vielleicht kompliziert, doch mit NocoBase wird dieser Prozess unkompliziert und macht Spaß. Wir werden gemeinsam Schritt für Schritt die Anforderungen klären, die Datenstruktur entwerfen und zukünftige Funktionen planen. Keine Sorge, wir werden uns nicht in unübersichtlichem Code verlieren, sondern auf möglichst intuitive und einfache Weise Ihr eigenes Aufgabenverwaltungssystem aufbauen.

### 2.1 Anforderungsanalyse

Bevor wir loslegen, klären wir, welche Funktionen dieses Aufgabenverwaltungssystem haben soll. Stellen Sie sich vor, wie Sie üblicherweise Aufgaben verwalten oder was Ihr ideales Aufgabenverwaltungssystem leisten sollte:

- **Aufgabenverwaltung**: Benutzer können Aufgaben anlegen, bearbeiten und löschen, Aufgaben verschiedenen Personen zuweisen und den Fortschritt jederzeit verfolgen.
- **Verschiedene Ansichten**: Aufgaben lassen sich nicht nur als Liste darstellen, sondern auch als Kanban-Board, Gantt-Diagramm oder Kalenderansicht.
- **Online-Dokumente**: Aufgabendokumente sollen online bearbeitet werden können, damit Teammitglieder Aufgabendetails verstehen.
- **Anhangsverwaltung**: Aufgaben sollen mit Anhängen versehen werden können – Bilder, Videos, wichtige Notizen usw.
- **Kommentarfunktion**: Beteiligte sollen Aufgaben kommentieren, Meinungen austauschen und Diskussionen festhalten können.

Mit einem einfachen Flussdiagramm bringen wir die Beziehungen dieser Funktionsmodule auf den Punkt:
![](https://static-docs.nocobase.com/20241219-0-%E4%BB%BB%E5%8A%A1%E7%AE%A1%E7%90%86ER.drawio.svg)

Sieht doch gleich viel klarer aus, oder?

---

> **Datentabellen kurz erklärt:** NocoBase verwendet ein Konzept namens „Collection“, um Datenstrukturen zu beschreiben. So lassen sich Daten aus verschiedenen Quellen vereinheitlichen und es entsteht eine solide Grundlage für Datenverwaltung und -analyse.
>
> Es werden viele Tabellentypen unterstützt – darunter normale Tabellen, vererbte Tabellen, Baumtabellen, Kalendertabellen, Dateitabellen, Ausdruckstabellen, SQL-Tabellen, View-Tabellen und externe Tabellen –, sodass unterschiedlichste Anforderungen abgedeckt werden. Dieser Aufbau macht Datenoperationen flexibel und effizient.

### 2.2 Entwurf der Datentabellen

Nun ist ein bisschen Denkarbeit gefragt. Damit unsere Funktionen umsetzbar sind, müssen wir die Tabellen des Systems planen. Aber keine Sorge: Wir benötigen keine komplexe Datenbankstruktur, ein paar einfache Tabellen reichen aus.

Aus den oben analysierten Anforderungen ergeben sich typischerweise folgende Tabellen:

1. **Benutzertabelle (Users)**: Erfasst die Benutzer des Systems. Wer arbeitet an welchen Aufgaben? Wer ist für die Verwaltung zuständig?
2. **Aufgabentabelle (Tasks)**: Enthält alle Detailinformationen einer Aufgabe – Name, Dokumentation, Verantwortliche, Fortschrittsstatus.
3. **Anhangstabelle (Attachments)**: Speichert alle aufgabenbezogenen Anhänge wie Bilder, Dateien usw.
4. **Kommentartabelle (Comments)**: Enthält die Kommentare der Benutzer zu Aufgaben und unterstützt so die Interaktion im Team.

Die Beziehungen zwischen diesen Tabellen sind einfach: Jede Aufgabe kann mehrere Anhänge und Kommentare haben, alle Anhänge und Kommentare werden von einem Benutzer angelegt oder hochgeladen. Das ist die Kernstruktur unseres Aufgabenverwaltungssystems.

In der folgenden Grafik sehen Sie die grundlegenden Beziehungen dieser Tabellen:
![](https://static-docs.nocobase.com/%E4%BB%BB%E5%8A%A1%E7%AE%A1%E7%90%86ER241219-0.drawio.svg)

### 2.3 Tabellenentwurf im NocoBase-System

Welche Tabellen müssen wir nun konkret in NocoBase entwerfen, um dieses Aufgabenverwaltungssystem umzusetzen? Tatsächlich noch einfacher, als Sie denken:

- **Aufgabentabelle**: Das Herzstück des Systems, hier werden die Detailinformationen jeder Aufgabe gespeichert.
- **Kommentartabelle**: Enthält die Kommentare zu Aufgaben, damit das Team Feedback geben kann.

Andere komplexere Funktionen wie Anhangsverwaltung und Benutzerinformationen werden von NocoBase bereits mitgeliefert – die müssen Sie nicht manuell anlegen. Das macht vieles deutlich entspannter, oder?

Wir starten mit einem einfachen Aufgabenverwaltungssystem und erweitern den Funktionsumfang schrittweise. Beispielsweise gestalten wir zunächst die Basisfelder einer Aufgabe und ergänzen später die Kommentarfunktion. Der Aufbau bleibt dadurch flexibel und gut steuerbar.

Die Gesamtstruktur sieht ungefähr so aus und enthält die benötigten Felder:
![](https://static-docs.nocobase.com/241219-1.svg)

### Zusammenfassung

In diesem Abschnitt haben Sie gelernt, wie Sie ein einfaches Aufgabenverwaltungssystem entwerfen. In NocoBase beginnen wir mit der Anforderungsanalyse, planen Datentabellen und Felder. Sie werden feststellen, dass die Umsetzung der Funktionen noch einfacher ist als der Entwurf.

Den Anfang der Aufgabentabelle halten wir zum Beispiel sehr schlank, etwa so:

```text
Aufgabentabelle (Tasks):
        Aufgabenname (task_name) Einzeiliger Text
        Aufgabenbeschreibung (task_description) Mehrzeiliger Text
```

Ziemlich übersichtlich, oder? Bereit für das [nächste Kapitel (Kapitel 3: Aufgabendatenverwaltung – souverän und mühelos einsteigen)](https://www.nocobase.com/cn/tutorials/task-tutorial-data-management-guide)?

---

Forschen Sie weiter und erschaffen Sie unbegrenzte Möglichkeiten! Falls beim Arbeiten Probleme auftreten, denken Sie daran, dass Sie jederzeit in der [offiziellen NocoBase-Dokumentation](https://docs-cn.nocobase.com/) nachlesen oder der [NocoBase-Community](https://forum.nocobase.com/) beitreten können. Wir sehen uns im nächsten Kapitel!
