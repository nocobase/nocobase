# Wie man installiert

> Die aktuelle Version verwendet die Form der **Sicherung und Wiederherstellung** für die Bereitstellung. In späteren Versionen werden wir möglicherweise auf die Form der **inkrementellen Migration** umsteigen, um die Integration der Lösung in Ihr bestehendes System zu erleichtern.

> **Das Plugin „Backup-Manager“ ist jetzt Open Source**: Das zur Wiederherstellung der Lösung benötigte Plugin „[Backup-Manager](https://docs-cn.nocobase.com/handbook/backups)“ ist jetzt Open Source und für alle Versionen (einschließlich der Community-Edition) verfügbar. Wir empfehlen, die Wiederherstellung direkt über dieses Plugin durchzuführen.

Bevor Sie beginnen, stellen Sie bitte sicher:

- Sie verfügen bereits über eine grundlegende NocoBase-Laufzeitumgebung. Informationen zur Installation des Hauptsystems finden Sie in der detaillierten [offiziellen Installationsdokumentation](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- NocoBase-Version **2.0.0-beta.5 und höher**
- Sie haben die Sicherungsdatei des Ticket-Systems heruntergeladen: [nocobase_tickets_v2_backup_260324.nbdata](https://static-docs.nocobase.com/nocobase_tickets_v2_backup_260324.nbdata)

**Wichtige Erläuterungen**:
- Diese Lösung wurde auf Basis der **PostgreSQL 16**-Datenbank erstellt. Bitte stellen Sie sicher, dass Ihre Umgebung PostgreSQL 16 verwendet.
- **DB_UNDERSCORED darf nicht true sein**: Bitte überprüfen Sie Ihre `docker-compose.yml`-Datei und stellen Sie sicher, dass die Umgebungsvariable `DB_UNDERSCORED` nicht auf `true` gesetzt ist, da dies sonst zu Konflikten mit der Lösungssicherung führt und die Wiederherstellung fehlschlägt.

---

## Wiederherstellung mit dem Backup-Manager

Diese Methode erfolgt über das in NocoBase integrierte Plugin „[Backup-Manager](https://docs-cn.nocobase.com/handbook/backups)“ für eine Ein-Klick-Wiederherstellung. Die Bedienung ist am einfachsten. Dieses Plugin ist jetzt Open Source und für alle Versionen (einschließlich der Community-Edition) verfügbar.

### Kernmerkmale

* **Vorteile**:
  1. **Bequeme Bedienung**: Kann direkt über die UI-Oberfläche abgeschlossen werden und ermöglicht die vollständige Wiederherstellung aller Konfigurationen einschließlich der Plugins.
  2. **Vollständige Wiederherstellung**: **Kann alle Systemdateien wiederherstellen**, einschließlich Vorlagen für den Druck, Dateien aus Datei-Feldern in Tabellen usw., um die vollständige Funktionalität zu gewährleisten.
* **Einschränkungen**:
  1. **Strenge Umgebungsanforderungen**: Erfordert, dass Ihre Datenbankumgebung (Version, Einstellungen zur Groß-/Kleinschreibung usw.) hochgradig kompatibel mit der Umgebung ist, in der wir die Sicherung erstellt haben.
  2. **Plugin-Abhängigkeit**: Wenn die Lösung kommerzielle Plugins enthält, die in Ihrer lokalen Umgebung nicht vorhanden sind, schlägt die Wiederherstellung fehl.

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

Wir hoffen, dass dieses Tutorial Ihnen hilft, das Ticket-System erfolgreich bereitzustellen. Wenn Sie während des Vorgangs auf Probleme stoßen, können Sie uns jederzeit kontaktieren!
---

*Last updated: 2026-03-24*
