:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/solution/crm/installation).
:::

# Wie man installiert

> Die aktuelle Version wird in Form von **Sicherung und Wiederherstellung** bereitgestellt. In zukünftigen Versionen werden wir möglicherweise auf **inkrementelle Migration** umstellen, um die Integration der Lösung in Ihre bestehenden Systeme zu erleichtern.

Um Ihnen eine schnelle und reibungslose Bereitstellung der CRM 2.0-Lösung in Ihrer eigenen NocoBase-Umgebung zu ermöglichen, bieten wir zwei Wiederherstellungsmethoden an. Bitte wählen Sie diejenige aus, die am besten zu Ihrer Benutzerversion und Ihrem technischen Hintergrund passt.

Bevor Sie beginnen, stellen Sie bitte sicher:

- Sie verfügen bereits über eine Basis-Laufzeitumgebung für NocoBase. Informationen zur Installation des Hauptsystems finden Sie in der detaillierten [offiziellen Installationsdokumentation](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- NocoBase-Version **v2.1.0-beta.2 und höher**
- Sie haben die entsprechenden Dateien des CRM-Systems heruntergeladen:
  - **Sicherungsdatei**: [nocobase_crm_v2_backup_260406.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260406.nbdata) - Anwendbar für Methode eins
  - **SQL-Datei**: [nocobase_crm_v2_sql_260406.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260406.zip) - Anwendbar für Methode zwei

**Wichtige Erläuterungen**:
- Diese Lösung basiert auf der **PostgreSQL 16**-Datenbank. Bitte stellen Sie sicher, dass Ihre Umgebung PostgreSQL 16 verwendet.
- **DB_UNDERSCORED darf nicht true sein**: Bitte überprüfen Sie Ihre `docker-compose.yml`-Datei und stellen Sie sicher, dass die Umgebungsvariable `DB_UNDERSCORED` nicht auf `true` gesetzt ist, da dies sonst zu Konflikten mit der Lösungssicherung führt und die Wiederherstellung fehlschlägt.

---

## Methode eins: Wiederherstellung mit dem Sicherungsmanager (Empfohlen für Professional-/Enterprise-Benutzer)

Diese Methode erfolgt über das in NocoBase integrierte Plugin "[Sicherungsmanager](https://docs-cn.nocobase.com/handbook/backups)" (Professional-/Enterprise-Version) per Ein-Klick-Wiederherstellung und ist am einfachsten zu bedienen. Sie stellt jedoch bestimmte Anforderungen an die Umgebung und die Benutzerversion.

### Kernmerkmale

* **Vorteile**:
  1. **Bequeme Bedienung**: Kann direkt über die Benutzeroberfläche (UI) abgeschlossen werden und ermöglicht die vollständige Wiederherstellung aller Konfigurationen einschließlich der Plugins.
  2. **Vollständige Wiederherstellung**: **Kann alle Systemdateien wiederherstellen**, einschließlich Druckvorlagendateien, über Dateifelder in Sammlungen hochgeladene Dateien usw., um die funktionale Integrität zu gewährleisten.
* **Einschränkungen**:
  1. **Beschränkt auf Professional-/Enterprise-Version**: Der „Sicherungsmanager“ ist ein Plugin auf Unternehmensebene und nur für Professional-/Enterprise-Benutzer verfügbar.
  2. **Strenge Umgebungsanforderungen**: Erfordert, dass Ihre Datenbankumgebung (Version, Einstellungen zur Groß-/Kleinschreibung usw.) hochgradig kompatibel mit der Umgebung ist, in der die Sicherung erstellt wurde.
  3. **Plugin-Abhängigkeit**: Wenn die Lösung kommerzielle Plugins enthält, die in Ihrer lokalen Umgebung nicht vorhanden sind, schlägt die Wiederherstellung fehl.

### Arbeitsschritte

**Schritt 1: [Dringend empfohlen] Starten Sie die Anwendung mit dem `full`-Image**

Um Wiederherstellungsfehler aufgrund eines fehlenden Datenbank-Clients zu vermeiden, empfehlen wir Ihnen dringend, die `full`-Version des Docker-Images zu verwenden. Sie enthält alle erforderlichen Begleitprogramme, sodass Sie keine zusätzlichen Konfigurationen vornehmen müssen.

Beispielbefehl zum Abrufen des Images:

```bash
docker pull nocobase/nocobase:beta-full
```

Verwenden Sie dann dieses Image, um Ihren NocoBase-Dienst zu starten.

> **Hinweis**: Wenn Sie das `full`-Image nicht verwenden, müssen Sie möglicherweise den `pg_dump`-Datenbank-Client manuell im Container installieren, was mühsam und instabil ist.

**Schritt 2: Aktivieren Sie das Plugin "Sicherungsmanager"**

1. Melden Sie sich bei Ihrem NocoBase-System an.
2. Gehen Sie zur **`Plugin-Verwaltung`**.
3. Suchen und aktivieren Sie das Plugin **`Sicherungsmanager`**.

**Schritt 3: Wiederherstellung aus einer lokalen Sicherungsdatei**

1. Aktualisieren Sie die Seite nach der Aktivierung des Plugins.
2. Gehen Sie im linken Menü zu **`Systemverwaltung`** -> **`Sicherungsmanager`**.
3. Klicken Sie oben rechts auf die Schaltfläche **`Aus lokaler Sicherung wiederherstellen`**.
4. Ziehen Sie die heruntergeladene Sicherungsdatei in den Upload-Bereich.
5. Klicken Sie auf **`Absenden`** und warten Sie geduldig, bis das System die Wiederherstellung abgeschlossen hat. Dieser Vorgang kann zwischen einigen Dutzend Sekunden und mehreren Minuten dauern.

### Hinweise

* **Datenbankkompatibilität**: Dies ist der wichtigste Punkt dieser Methode. Ihre PostgreSQL-Datenbank-**Version, der Zeichensatz und die Einstellungen zur Groß-/Kleinschreibung** müssen mit der Sicherungsquelldatei übereinstimmen. Insbesondere muss der Name des `schema` identisch sein.
* **Abgleich kommerzieller Plugins**: Bitte stellen Sie sicher, dass Sie alle für die Lösung erforderlichen kommerziellen Plugins besitzen und aktiviert haben, da die Wiederherstellung sonst unterbrochen wird.

---

## Methode zwei: Direktes Importieren der SQL-Datei (Universell, besser geeignet für die Community-Version)

Diese Methode stellt die Daten durch direkte Operationen an der Datenbank wieder her, umgeht das Plugin "Sicherungsmanager" und unterliegt daher nicht den Einschränkungen der Professional-/Enterprise-Version.

### Kernmerkmale

* **Vorteile**:
  1. **Keine Versionsbeschränkungen**: Geeignet für alle NocoBase-Benutzer, einschließlich der Community-Version.
  2. **Hohe Kompatibilität**: Hängt nicht vom anwendungsinternen `dump`-Werkzeug ab; solange eine Verbindung zur Datenbank hergestellt werden kann, ist die Operation möglich.
  3. **Hohe Fehlertoleranz**: Wenn die Lösung kommerzielle Plugins enthält, die Sie nicht besitzen, werden die entsprechenden Funktionen nicht aktiviert, was jedoch die normale Nutzung anderer Funktionen nicht beeinträchtigt; die Anwendung kann erfolgreich gestartet werden.
* **Einschränkungen**:
  1. **Erfordert Datenbank-Kenntnisse**: Benutzer müssen über grundlegende Kenntnisse in der Datenbankbedienung verfügen, z. B. wie eine `.sql`-Datei ausgeführt wird.
  2. **Verlust von Systemdateien**: **Bei dieser Methode gehen alle Systemdateien verloren**, einschließlich Druckvorlagendateien, über Dateifelder in Sammlungen hochgeladene Dateien usw.

### Arbeitsschritte

**Schritt 1: Vorbereiten einer sauberen Datenbank**

Bereiten Sie eine völlig neue, leere Datenbank für die Daten vor, die Sie importieren möchten.

**Schritt 2: Importieren der `.sql`-Datei in die Datenbank**

Holen Sie sich die heruntergeladene Datenbankdatei (normalerweise im `.sql`-Format) und importieren Sie deren Inhalt in die im vorherigen Schritt vorbereitete Datenbank. Es gibt mehrere Möglichkeiten der Ausführung, abhängig von Ihrer Umgebung:

* **Option A: Über die Server-Kommandozeile (Beispiel Docker)**
  Wenn Sie Docker zur Installation von NocoBase und der Datenbank verwenden, können Sie die `.sql`-Datei auf den Server hochladen und dann den Befehl `docker exec` zum Importieren verwenden. Angenommen, Ihr PostgreSQL-Container heißt `my-nocobase-db` und der Dateiname lautet `nocobase_crm_v2_sql_260327.sql`:

  ```bash
  # Kopieren Sie die SQL-Datei in den Container
  docker cp nocobase_crm_v2_sql_260327.sql my-nocobase-db:/tmp/
  # Betreten Sie den Container und führen Sie den Importbefehl aus
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_crm_v2_sql_260327.sql
  ```
* **Option B: Über einen Remote-Datenbank-Client (Navicat usw.)**
  Wenn der Port Ihrer Datenbank freigegeben ist, können Sie einen beliebigen grafischen Datenbank-Client (wie Navicat, DBeaver, pgAdmin usw.) verwenden, um eine Verbindung zur Datenbank herzustellen, und dann:
  1. Klicken Sie mit der rechten Maustaste auf die Zieldatenbank.
  2. Wählen Sie "SQL-Datei ausführen" oder "SQL-Skript ausführen".
  3. Wählen Sie die heruntergeladene `.sql`-Datei aus und führen Sie sie aus.

**Schritt 3: Datenbank verbinden und Anwendung starten**

Konfigurieren Sie Ihre NocoBase-Startparameter (wie die Umgebungsvariablen `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` usw.) so, dass sie auf die Datenbank zeigen, in die Sie gerade die Daten importiert haben. Starten Sie dann den NocoBase-Dienst normal.

### Hinweise

* **Datenbankberechtigungen**: Diese Methode erfordert, dass Sie über ein Konto und ein Passwort verfügen, mit denen Sie die Datenbank direkt bedienen können.
* **Plugin-Status**: Nach dem erfolgreichen Import sind die Daten der im System enthaltenen kommerziellen Plugins zwar vorhanden, aber wenn Sie die entsprechenden Plugins lokal nicht installiert und aktiviert haben, werden die zugehörigen Funktionen nicht angezeigt oder nutzbar sein. Dies führt jedoch nicht zum Absturz der Anwendung.

---

## Zusammenfassung und Vergleich

| Merkmal | Methode eins: Sicherungsmanager | Methode zwei: Direkter SQL-Import |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Zielgruppe** | **Professional-/Enterprise-Version** Benutzer | **Alle Benutzer** (einschließlich Community-Version) |
| **Bedienkomfort** | ⭐⭐⭐⭐⭐ (Sehr einfach, UI-Bedienung) | ⭐⭐⭐ (Erfordert Datenbank-Grundkenntnisse) |
| **Umgebungsanforderungen** | **Streng**, Datenbank- und Systemversionen müssen hochgradig kompatibel sein | **Allgemein**, erfordert Datenbankkompatibilität |
| **Plugin-Abhängigkeit** | **Starke Abhängigkeit**, Plugins werden bei der Wiederherstellung validiert; das Fehlen eines Plugins führt zum **Fehlschlagen der Wiederherstellung**. | **Funktionen hängen stark von Plugins ab**. Daten können unabhängig importiert werden, das System verfügt über Basisfunktionen. Wenn jedoch entsprechende Plugins fehlen, sind die zugehörigen Funktionen **völlig unbrauchbar**. |
| **Systemdateien** | **Vollständig erhalten** (Druckvorlagen, hochgeladene Dateien usw.) | **Gehen verloren** (Druckvorlagen, hochgeladene Dateien usw.) |
| **Empfohlenes Szenario** | Unternehmensbenutzer mit kontrollierbarer, konsistenter Umgebung, die den vollen Funktionsumfang benötigen | Fehlende Plugins, Streben nach hoher Kompatibilität und Flexibilität, Nicht-Professional-/Enterprise-Benutzer, die den Verlust von Dateifunktionen akzeptieren können |

Wir hoffen, dass dieses Tutorial Ihnen hilft, das CRM 2.0-System erfolgreich bereitzustellen. Wenn Sie während des Vorgangs auf Probleme stoßen, können Sie uns jederzeit kontaktieren!
---

*Last updated: 2026-04-02*
