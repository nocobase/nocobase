---
title: "All-in-One-Business-System – Installation"
description: "Installation und Bereitstellung des All-in-One-Business-Systems: Restore über den Backup-Manager (Professional / Enterprise) oder Import einer SQL-Datei (Community). Erfordert PostgreSQL 16; DB_UNDERSCORED darf nicht auf true gesetzt sein."
keywords: "All-in-One-Business-System Installation, All-in-One, Backup-Restore, Backup-Manager, SQL-Import, PostgreSQL, NocoBase"
---

# Installation

> Die aktuelle Version wird über **Backup-Restore** bereitgestellt. Künftige Versionen werden möglicherweise auf **inkrementelle Migration** umgestellt, um die Lösung leichter in bestehende NocoBase-Systeme zu integrieren.

Das All-in-One-Business-System umfasst sechs Module: **CRM (Kundenverwaltung), Vertriebsmanagement, Helpdesk (Tickets), Projektmanagement, Anlagenverwaltung und HR (Personalverwaltung)**. Damit Sie die Lösung schnell und reibungslos in Ihrer eigenen NocoBase-Umgebung einsetzen können, bieten wir zwei Restore-Varianten an. Wählen Sie diejenige aus, die zu Ihrer Edition und Ihrem technischen Umfeld passt.

Bitte stellen Sie vorab Folgendes sicher:

- Sie verfügen über eine lauffähige NocoBase-Basisumgebung. Zur Installation der Hauptanwendung siehe die [offizielle Installationsanleitung](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- NocoBase-Version **v2.1.0-alpha.34 oder höher**.
- Sie haben die zur Lösung gehörigen Dateien heruntergeladen:
  - **Backup-Datei**: [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata) – für Methode 1
  - **SQL-Datei**: [nocobase_all_in_one_sql_260521.zip](https://static-docs.nocobase.com/nocobase_all_in_one_sql_260521.zip) – für Methode 2

**Wichtige Hinweise**:

- Die Lösung wurde auf **PostgreSQL 16** erstellt. Stellen Sie sicher, dass Ihre Umgebung PostgreSQL 16 verwendet.
- **DB_UNDERSCORED darf nicht true sein**: Prüfen Sie Ihre `docker-compose.yml` und stellen Sie sicher, dass die Umgebungsvariable `DB_UNDERSCORED` nicht auf `true` gesetzt ist. Andernfalls kommt es zu Konflikten mit dem Backup und das Restore schlägt fehl.

---

## Methode 1: Restore über den Backup-Manager (empfohlen für Professional / Enterprise)

Diese Methode nutzt das in NocoBase integrierte Plug-in "[Backup-Manager](https://docs-cn.nocobase.com/handbook/backups)" (Professional / Enterprise) für ein Ein-Klick-Restore. Sie ist am einfachsten zu bedienen, stellt aber bestimmte Anforderungen an Umgebung und Edition.

### Eigenschaften

* **Vorteile**:
  1. **Komfortable Bedienung**: vollständig über die Benutzeroberfläche, mit Wiederherstellung aller Konfigurationen einschließlich der Plug-ins.
  2. **Vollständige Wiederherstellung**: **Alle Systemdateien werden wiederhergestellt**, etwa Druckvorlagen, in Dateifeldern hochgeladene Dateien sowie Avatare der AI-Mitarbeiter.
* **Einschränkungen**:
  1. **Nur Professional / Enterprise**: Der Backup-Manager ist ein Enterprise-Plug-in und nur für diese Editionen verfügbar.
  2. **Strenge Umgebungsanforderungen**: Datenbankversion und Groß-/Kleinschreibung der Umgebung müssen mit denen des Backups stark übereinstimmen.
  3. **Plug-in-Abhängigkeiten**: Enthält die Lösung kommerzielle Plug-ins, die in Ihrer lokalen Umgebung fehlen, schlägt das Restore fehl.

### Vorgehen

**Schritt 1: [Dringend empfohlen] Anwendung mit dem `full`-Image starten**

Um Restore-Fehler durch fehlende Datenbank-Clients zu vermeiden, empfehlen wir dringend, das Docker-Image in der Variante `full` zu verwenden. Es enthält alle benötigten Hilfsprogramme und erfordert keine zusätzliche Konfiguration.

Beispiel zum Ziehen des Images:

```bash
docker pull nocobase/nocobase:alpha-full
```

Starten Sie anschließend Ihren NocoBase-Dienst mit diesem Image.

> **Hinweis**: Ohne das `full`-Image müssen Sie ggf. den `pg_dump`-Datenbank-Client manuell im Container installieren – ein aufwendiger und fehleranfälliger Vorgang.

**Schritt 2: Plug-in "Backup-Manager" aktivieren**

1. Melden Sie sich in Ihrem NocoBase-System an.
2. Öffnen Sie die **Plug-in-Verwaltung**.
3. Suchen und aktivieren Sie das Plug-in **Backup-Manager**.

**Schritt 3: Restore aus einer lokalen Backup-Datei**

1. Aktualisieren Sie die Seite nach dem Aktivieren des Plug-ins.
2. Navigieren Sie im linken Menü zu **Systemverwaltung** → **Backup-Manager**.
3. Klicken Sie oben rechts auf **Aus lokalem Backup wiederherstellen**.
4. Ziehen Sie die heruntergeladene Datei `nocobase_all_in_one_backup_260521.nbdata` in den Upload-Bereich.
5. Klicken Sie auf **Absenden** und warten Sie ab, bis das Restore abgeschlossen ist. Je nach Datenmenge kann dies einige zehn Sekunden bis mehrere Minuten dauern.

### Hinweise

* **Datenbankkompatibilität**: Dieser Punkt ist bei dieser Methode entscheidend. **Version, Zeichensatz und Groß-/Kleinschreibung** Ihrer PostgreSQL-Datenbank müssen zur Backup-Quelle passen, insbesondere muss der `schema`-Name übereinstimmen.
* **Kommerzielle Plug-ins**: Stellen Sie sicher, dass Sie alle für die Lösung erforderlichen kommerziellen Plug-ins besitzen und aktiviert haben. Andernfalls bricht das Restore ab. Zur All-in-One-Lösung gehören u. a. Backup-Manager, Mail-Manager, Audit-Log und AI-Mitarbeiter.

---

## Methode 2: SQL-Datei direkt importieren (universell, für die Community Edition geeignet)

Diese Methode greift direkt auf die Datenbank zu und umgeht damit das Plug-in "Backup-Manager". Sie unterliegt keiner Edition-Beschränkung.

### Eigenschaften

* **Vorteile**:
  1. **Keine Versionsbeschränkung**: nutzbar von allen NocoBase-Anwenderinnen und -Anwendern, einschließlich Community Edition.
  2. **Hohe Kompatibilität**: unabhängig vom integrierten `dump`-Tool – ein funktionierender Datenbankzugriff genügt.
  3. **Hohe Fehlertoleranz**: Fehlen in Ihrer Umgebung kommerzielle Plug-ins, werden die zugehörigen Funktionen nicht angezeigt, andere Funktionen bleiben jedoch verfügbar und die Anwendung startet erfolgreich.
* **Einschränkungen**:
  1. **Grundkenntnisse Datenbank**: Die Anwenderin oder der Anwender sollte z. B. eine `.sql`-Datei ausführen können.
  2. **Verlust von Systemdateien**: **Bei dieser Methode gehen alle Systemdateien verloren**, darunter Druckvorlagen, in Dateifeldern hochgeladene Dateien und Avatare der AI-Mitarbeiter.

### Vorgehen

**Schritt 1: Eine leere Datenbank vorbereiten**

Bereiten Sie eine neue, leere Datenbank (PostgreSQL 16) für die zu importierenden Daten vor.

**Schritt 2: `.sql`-Datei in die Datenbank importieren**

Entpacken Sie die heruntergeladene Datei `nocobase_all_in_one_sql_260521.zip`, um die `.sql`-Datei zu erhalten, und spielen Sie deren Inhalt in die zuvor vorbereitete Datenbank ein. Mehrere Vorgehensweisen sind möglich:

* **Variante A: Über die Serverkonsole (Beispiel Docker)**

  Wenn Sie NocoBase und die Datenbank per Docker betreiben, können Sie die `.sql`-Datei auf den Server laden und mit `docker exec` importieren. Angenommen, Ihr PostgreSQL-Container heißt `my-nocobase-db`:

  ```bash
  # SQL-Datei in den Container kopieren
  docker cp nocobase_all_in_one_sql_260521.sql my-nocobase-db:/tmp/
  # Im Container den Import ausführen
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_all_in_one_sql_260521.sql
  ```

* **Variante B: Über einen entfernten Datenbankclient (Navicat o. ä.)**

  Wenn Ihre Datenbank einen Port nach außen freigibt, können Sie einen grafischen Client (Navicat, DBeaver, pgAdmin u. a.) verwenden und folgendermaßen vorgehen:

  1. Rechtsklick auf die Zieldatenbank
  2. "SQL-Datei ausführen" oder "SQL-Skript ausführen" wählen
  3. Die heruntergeladene `.sql`-Datei auswählen und ausführen

**Schritt 3: Datenbank anbinden und Anwendung starten**

Konfigurieren Sie die Startparameter von NocoBase (z. B. die Umgebungsvariablen `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`) so, dass sie auf Ihre frisch befüllte Datenbank zeigen, und starten Sie den NocoBase-Dienst normal.

### Hinweise

* **Datenbankrechte**: Diese Methode erfordert ein Konto mit direktem Zugriff auf die Datenbank.
* **Plug-in-Status**: Nach erfolgreichem Import sind die Daten der kommerziellen Plug-ins zwar vorhanden, die zugehörigen Funktionen bleiben jedoch ohne installiertes und aktiviertes Plug-in unsichtbar und nutzlos. Die Anwendung stürzt deshalb nicht ab.

---

## Zusammenfassung und Vergleich

| Merkmal | Methode 1: Backup-Manager | Methode 2: SQL-Import |
| :--- | :--- | :--- |
| **Zielgruppe** | **Professional / Enterprise** | **Alle** (einschließlich Community) |
| **Einfachheit** | ⭐⭐⭐⭐⭐ (sehr einfach, UI-Bedienung) | ⭐⭐⭐ (Grundkenntnisse Datenbank erforderlich) |
| **Umgebungsanforderungen** | **Streng**: Datenbank und Systemversion müssen stark übereinstimmen | **Moderat**: Datenbankkompatibilität genügt |
| **Plug-in-Abhängigkeit** | **Stark**: das Restore prüft die Plug-ins, fehlende Plug-ins führen zum **Abbruch** | **Funktional stark abhängig**: Daten können unabhängig importiert werden, das System bleibt grundlegend funktionsfähig. Ohne entsprechende Plug-ins sind die zugehörigen Funktionen jedoch **nicht nutzbar** |
| **Systemdateien** | **Vollständig erhalten** (Druckvorlagen, Uploads, Avatare u. a.) | **Gehen verloren** (Druckvorlagen, Uploads, Avatare u. a.) |
| **Empfohlenes Szenario** | Enterprise-Anwendung mit kontrollierter, konsistenter Umgebung und vollem Funktionsumfang | Fehlen einzelner Plug-ins, Bedarf an hoher Kompatibilität und Flexibilität, Community Edition, Verzicht auf dateibezogene Funktionen akzeptabel |

---

## Häufige Fragen

### Funktioniert die Professional Edition? Gibt es Fehler?

Sie können sie direkt einsetzen, ohne dass Fehler auftreten. Die Demo verwendet einige Enterprise-Plug-ins (z. B. Mail-Manager, Audit-Log, AI-Mitarbeiter). Fehlen diese in der Professional Edition, werden die zugehörigen Einstiegspunkte ausgeblendet, **die übrigen Module bleiben jedoch uneingeschränkt nutzbar**. Beispielsweise verschwindet der Einstieg zum Audit-Log, während CRM, Vertrieb, Tickets, Projekte, Anlagen und HR vollständig funktionieren.

### Welche Version sollte nach dem Restore verwendet werden?

Wir empfehlen das neueste Image in der `alpha-full`-Variante (z. B. `nocobase/nocobase:alpha-full`). Das `full`-Image enthält Datenbank-Clients und andere Abhängigkeiten und vermeidet Restore-Fehler durch fehlende Werkzeuge.

### Nach dem Restore wird das Logo nicht angezeigt?

Das Logo der Demo auf unserer Website ist domainbeschränkt und lässt sich unter Ihrer eigenen Domain nicht laden. Laden Sie unter **Systemeinstellungen** Ihr eigenes Logo hoch.

### Fehler beim Dateiupload (OSS-Key-Fehler)?

Nach der SQL-Installation kann der Dateiupload OSS-bezogene Fehler verursachen. Lösung: Öffnen Sie **Plug-in-Verwaltung → Dateimanager** und setzen Sie **Local Storage** als Standard-Speicher. Speichern, danach funktioniert der Upload wieder.

### Sprachwechsel?

Die All-in-One-Lösung wurde in mehr als 20 Sprachen lokalisiert (Namespace `nb_demo`). Nach dem Restore ist Chinesisch voreingestellt. Um eine andere Sprache zu nutzen: **Systemeinstellungen → entsprechende Sprache aktivieren** (aktivieren Sie nicht `ar-SA`, da dies aktuell zu Renderingfehlern in NocoBase führt).

### Wie funktioniert ein inkrementelles Upgrade?

Aktuell wird beim Upgrade die gesamte Lösung ersetzt, eigene Anpassungen werden überschrieben. Vor dem Upgrade unbedingt sichern. Eine inkrementelle Migration ist in Planung und wird zunächst Professional / Enterprise unterstützen. Für die Community Edition ist eine Unterstützung wegen des fehlenden Migration-Manager-Plug-ins vorerst schwierig.

Wir hoffen, dass dieses Tutorial Ihnen bei der Bereitstellung des All-in-One-Business-Systems hilft. Bei Fragen während des Vorgangs kontaktieren Sie uns gerne.
