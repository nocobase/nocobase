:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/solution/ticket-system/installation).
:::

# Wie man installiert

> Die aktuelle Version verwendet die Form der **Sicherung und Wiederherstellung** für die Bereitstellung. In späteren Versionen werden wir möglicherweise auf die Form der **inkrementellen Migration** umsteigen, um die Integration der Lösung in Ihr bestehendes System zu erleichtern.

Damit Sie die Ticket-Lösung schnell und reibungslos in Ihrer eigenen NocoBase-Umgebung bereitstellen können, bieten wir zwei Wiederherstellungsmethoden an. Bitte wählen Sie diejenige aus, die am besten zu Ihrer Benutzerversion und Ihrem technischen Hintergrund passt.

Bevor Sie beginnen, stellen Sie bitte sicher:

- Sie verfügen bereits über eine grundlegende NocoBase-Laufzeitumgebung. Informationen zur Installation des Hauptsystems finden Sie in der detaillierten [offiziellen Installationsdokumentation](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- NocoBase-Version **2.0.0-beta.5 und höher**
- Sie haben die entsprechenden Dateien des Ticket-Systems heruntergeladen:
  - **Sicherungsdatei**: [nocobase_tickets_v2_backup_260324.nbdata](https://static-docs.nocobase.com/nocobase_tickets_v2_backup_260324.nbdata) - Anwendbar für Methode Eins
  - **SQL-Datei**: [nocobase_tickets_v2_sql_260324.zip](https://static-docs.nocobase.com/nocobase_tickets_v2_sql_260324.zip) - Anwendbar für Methode Zwei

**Wichtige Erläuterungen**:
- Diese Lösung wurde auf Basis der **PostgreSQL 16**-Datenbank erstellt. Bitte stellen Sie sicher, dass Ihre Umgebung PostgreSQL 16 verwendet.
- **DB_UNDERSCORED darf nicht true sein**: Bitte überprüfen Sie Ihre `docker-compose.yml`-Datei und stellen Sie sicher, dass die Umgebungsvariable `DB_UNDERSCORED` nicht auf `true` gesetzt ist, da dies sonst zu Konflikten mit der Lösungssicherung führt und die Wiederherstellung fehlschlägt.

---

## Methode Eins: Wiederherstellung mit dem Backup-Manager (Empfohlen für Pro/Enterprise-Benutzer)

Diese Methode erfolgt über das in NocoBase integrierte Plugin „[Backup-Manager](https://docs-cn.nocobase.com/handbook/backups)“ (Pro/Enterprise) für eine Ein-Klick-Wiederherstellung. Die Bedienung ist am einfachsten, stellt jedoch bestimmte Anforderungen an die Umgebung und die Benutzerversion.

### Kernmerkmale

* **Vorteile**:
  1. **Bequeme Bedienung**: Kann direkt über die UI-Oberfläche abgeschlossen werden und ermöglicht die vollständige Wiederherstellung aller Konfigurationen einschließlich der Plugins.
  2. **Vollständige Wiederherstellung**: **Kann alle Systemdateien wiederherstellen**, einschließlich Vorlagen für den Druck, Dateien aus Datei-Feldern in Tabellen usw., um die vollständige Funktionalität zu gewährleisten.
* **Einschränkungen**:
  1. **Nur Pro/Enterprise**: Der „Backup-Manager“ ist ein Plugin auf Enterprise-Ebene und nur für Pro/Enterprise-Benutzer verfügbar.
  2. **Strenge Umgebungsanforderungen**: Erfordert, dass Ihre Datenbankumgebung (Version, Einstellungen zur Groß-/Kleinschreibung usw.) hochgradig kompatibel mit der Umgebung ist, in der wir die Sicherung erstellt haben.
  3. **Plugin-Abhängigkeit**: Wenn die Lösung kommerzielle Plugins enthält, die in Ihrer lokalen Umgebung nicht vorhanden sind, schlägt die Wiederherstellung fehl.

### Arbeitsschritte

**Schritt 1: [Dringend empfohlen] Starten Sie die Anwendung mit dem `full`-Image**

Um ein Fehlschlagen der Wiederherstellung aufgrund fehlender Datenbank-Clients zu vermeiden, empfehlen wir Ihnen dringend, die `full`-Version des Docker-Images zu verwenden. Es enthält alle erforderlichen Begleitprogramme, sodass Sie keine zusätzliche Konfiguration vornehmen müssen.

Beispiel für den Befehl zum Abrufen des Images:

```bash
docker pull nocobase/nocobase:beta-full
```

Verwenden Sie dann dieses Image, um Ihren NocoBase-Dienst zu starten.

> **Hinweis**: Wenn Sie das `full`-Image nicht verwenden, müssen Sie möglicherweise den `pg_dump`-Datenbank-Client manuell im Container installieren, was mühsam und instabil ist.

**Schritt 2: Aktivieren Sie das „Backup-Manager“-Plugin**

1. Melden Sie sich bei Ihrem NocoBase-System an.
2. Gehen Sie zur **`Plugin-Verwaltung`**.
3. Suchen und aktivieren Sie das Plugin **`Backup-Manager`**.

**Schritt 3: Wiederherstellung aus einer lokalen Sicherungsdatei**

1. Aktualisieren Sie die Seite nach der Aktivierung des Plugins.
2. Gehen Sie im linken Menü auf **`Systemverwaltung`** -> **`Backup-Manager`**.
3. Klicken Sie oben rechts auf die Schaltfläche **`Aus lokaler Sicherung wiederherstellen`**.
4. Ziehen Sie die heruntergeladene Sicherungsdatei in den Upload-Bereich.
5. Klicken Sie auf **`Absenden`** und warten Sie geduldig, bis das System die Wiederherstellung abgeschlossen hat. Dieser Vorgang kann einige Sekunden bis zu einigen Minuten dauern.

### Sicherheitshinweise

* **Datenbankkompatibilität**: Dies ist der wichtigste Punkt bei dieser Methode. Die **Version, der Zeichensatz und die Einstellungen zur Groß-/Kleinschreibung** Ihrer PostgreSQL-Datenbank müssen mit der Quellsicherungsdatei übereinstimmen. Insbesondere der Name des `schema` muss identisch sein.
* **Übereinstimmung kommerzieller Plugins**: Bitte stellen Sie sicher, dass Sie alle für die Lösung erforderlichen kommerziellen Plugins besitzen und aktiviert haben, da die Wiederherstellung sonst unterbrochen wird.

---

## Methode Zwei: Direkter Import der SQL-Datei (Universell, besser geeignet für die Community-Edition)

Diese Methode stellt Daten durch direkten Betrieb der Datenbank wieder her, umgeht das Plugin „Backup-Manager“ und unterliegt daher nicht den Einschränkungen von Pro/Enterprise-Plugins.

### Kernmerkmale

* **Vorteile**:
  1. **Keine Versionsbeschränkung**: Anwendbar auf alle NocoBase-Benutzer, einschließlich der Community-Edition.
  2. **Hohe Kompatibilität**: Hängt nicht vom anwendungsinternen `dump`-Tool ab; solange eine Verbindung zur Datenbank hergestellt werden kann, ist der Betrieb möglich.
  3. **Hohe Fehlertoleranz**: Wenn die Lösung kommerzielle Plugins enthält, die Sie nicht haben, werden die entsprechenden Funktionen nicht aktiviert, was jedoch die normale Nutzung anderer Funktionen nicht beeinträchtigt; die Anwendung kann erfolgreich gestartet werden.
* **Einschränkungen**:
  1. **Erfordert Datenbank-Kenntnisse**: Benutzer müssen über grundlegende Kenntnisse im Betrieb von Datenbanken verfügen, z. B. wie eine `.sql`-Datei ausgeführt wird.
  2. **Verlust von Systemdateien**: **Bei dieser Methode gehen alle Systemdateien verloren**, einschließlich Vorlagen für den Druck, Dateien aus Datei-Feldern in Tabellen usw.

### Arbeitsschritte

**Schritt 1: Bereiten Sie eine saubere Datenbank vor**

Bereiten Sie eine brandneue, leere Datenbank für die Daten vor, die Sie importieren möchten.

**Schritt 2: Importieren Sie die `.sql`-Datei in die Datenbank**

Besorgen Sie sich die heruntergeladene Datenbankdatei (normalerweise im `.sql`-Format) und importieren Sie deren Inhalt in die im vorherigen Schritt vorbereitete Datenbank. Es gibt verschiedene Möglichkeiten der Ausführung, abhängig von Ihrer Umgebung:

* **Option A: Über die Server-Kommandozeile (Beispiel mit Docker)**
  Wenn Sie Docker zur Installation von NocoBase und der Datenbank verwenden, können Sie die `.sql`-Datei auf den Server hochladen und dann den Befehl `docker exec` verwenden, um den Import auszuführen. Angenommen, Ihr PostgreSQL-Container heißt `my-nocobase-db` und der Dateiname ist `ticket_system.sql`:

  ```bash
  # Kopieren Sie die SQL-Datei in den Container
  docker cp ticket_system.sql my-nocobase-db:/tmp/
  # Gehen Sie in den Container und führen Sie den Import-Befehl aus
  docker exec -it my-nocobase-db psql -U ihr_benutzername -d ihr_datenbankname -f /tmp/ticket_system.sql
  ```
* **Option B: Über einen Remote-Datenbank-Client**
  Wenn Ihre Datenbank einen Port freigibt, können Sie jeden grafischen Datenbank-Client (wie DBeaver, Navicat, pgAdmin usw.) verwenden, um eine Verbindung zur Datenbank herzustellen, ein neues Abfragefenster zu öffnen, den gesamten Inhalt der `.sql`-Datei einzufügen und auszuführen.

**Schritt 3: Datenbank verbinden und Anwendung starten**

Konfigurieren Sie Ihre NocoBase-Startparameter (wie die Umgebungsvariablen `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` usw.) so, dass sie auf die Datenbank zeigen, in die Sie gerade die Daten importiert haben. Starten Sie dann den NocoBase-Dienst normal.

### Sicherheitshinweise

* **Datenbankberechtigungen**: Diese Methode erfordert, dass Sie über ein Konto und ein Passwort verfügen, mit denen Sie die Datenbank direkt verwalten können.
* **Plugin-Status**: Nach dem erfolgreichen Import sind die Daten der kommerziellen Plugins im System zwar vorhanden, aber wenn Sie die entsprechenden Plugins lokal nicht installiert und aktiviert haben, können die zugehörigen Funktionen nicht angezeigt oder verwendet werden. Dies führt jedoch nicht zum Absturz der Anwendung.

---

## Zusammenfassung und Vergleich

| Merkmal | Methode Eins: Backup-Manager | Methode Zwei: Direkter SQL-Import |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Zielbenutzer** | **Pro/Enterprise**-Benutzer | **Alle Benutzer** (einschließlich Community-Edition) |
| **Einfachheit der Bedienung** | ⭐⭐⭐⭐⭐ (Sehr einfach, UI-Bedienung) | ⭐⭐⭐ (Erfordert grundlegende Datenbank-Kenntnisse) |
| **Umgebungsanforderungen** | **Streng**, Datenbank, Systemversion usw. müssen hochgradig kompatibel sein | **Allgemein**, erfordert Datenbankkompatibilität |
| **Plugin-Abhängigkeit** | **Starke Abhängigkeit**, Plugins werden bei der Wiederherstellung validiert; das Fehlen eines Plugins führt zum **Fehlschlagen der Wiederherstellung**. | **Funktionen hängen stark von Plugins ab**. Daten können unabhängig importiert werden, das System verfügt über Basisfunktionen. Wenn jedoch entsprechende Plugins fehlen, sind die zugehörigen Funktionen **völlig unbrauchbar**. |
| **Systemdateien** | **Vollständig erhalten** (Druckvorlagen, hochgeladene Dateien usw.) | **Gehen verloren** (Druckvorlagen, hochgeladene Dateien usw.) |
| **Empfohlenes Szenario** | Enterprise-Benutzer mit kontrollierbarer, konsistenter Umgebung, die den vollen Funktionsumfang benötigen | Fehlen einiger Plugins, Wunsch nach hoher Kompatibilität und Flexibilität, Nicht-Pro/Enterprise-Benutzer, Verlust der Dateifunktionen akzeptabel |

Wir hoffen, dass dieses Tutorial Ihnen hilft, das Ticket-System erfolgreich bereitzustellen. Wenn Sie während des Vorgangs auf Probleme stoßen, können Sie uns jederzeit kontaktieren!
---

*Last updated: 2026-03-24*
