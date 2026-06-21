# Wie man installiert

> Die aktuelle Version wird in Form von **Sicherung und Wiederherstellung** bereitgestellt. In zukünftigen Versionen werden wir möglicherweise auf **inkrementelle Migration** umstellen, um die Integration der Lösung in Ihre bestehenden Systeme zu erleichtern.

> **Das Plugin „Sicherungsmanager“ ist jetzt Open Source**: Das zur Wiederherstellung der Lösung benötigte Plugin „[Sicherungsmanager](https://docs-cn.nocobase.com/handbook/backups)“ ist jetzt Open Source und für alle Versionen (einschließlich der Community-Version) verfügbar. Wir empfehlen, die Wiederherstellung direkt über dieses Plugin durchzuführen.

Bevor Sie beginnen, stellen Sie bitte sicher:

- Sie verfügen bereits über eine Basis-Laufzeitumgebung für NocoBase. Informationen zur Installation des Hauptsystems finden Sie in der detaillierten [offiziellen Installationsdokumentation](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- NocoBase-Version **v2.1.0-beta.2 und höher**
- Sie haben die Sicherungsdatei des CRM-Systems heruntergeladen: [nocobase_crm_v2_backup_260523.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260523.nbdata)

**Wichtige Erläuterungen**:
- Diese Lösung basiert auf der **PostgreSQL 16**-Datenbank. Bitte stellen Sie sicher, dass Ihre Umgebung PostgreSQL 16 verwendet.
- **DB_UNDERSCORED darf nicht true sein**: Bitte überprüfen Sie Ihre `docker-compose.yml`-Datei und stellen Sie sicher, dass die Umgebungsvariable `DB_UNDERSCORED` nicht auf `true` gesetzt ist, da dies sonst zu Konflikten mit der Lösungssicherung führt und die Wiederherstellung fehlschlägt.

---

## Wiederherstellung mit dem Sicherungsmanager

Diese Methode erfolgt über das in NocoBase integrierte Plugin "[Sicherungsmanager](https://docs-cn.nocobase.com/handbook/backups)" per Ein-Klick-Wiederherstellung und ist am einfachsten zu bedienen. Dieses Plugin ist jetzt Open Source und für alle Versionen (einschließlich der Community-Version) verfügbar.

### Kernmerkmale

* **Vorteile**:
  1. **Bequeme Bedienung**: Kann direkt über die Benutzeroberfläche (UI) abgeschlossen werden und ermöglicht die vollständige Wiederherstellung aller Konfigurationen einschließlich der Plugins.
  2. **Vollständige Wiederherstellung**: **Kann alle Systemdateien wiederherstellen**, einschließlich Druckvorlagendateien, über Dateifelder in Sammlungen hochgeladene Dateien usw., um die funktionale Integrität zu gewährleisten.
* **Einschränkungen**:
  1. **Strenge Umgebungsanforderungen**: Erfordert, dass Ihre Datenbankumgebung (Version, Einstellungen zur Groß-/Kleinschreibung usw.) hochgradig kompatibel mit der Umgebung ist, in der die Sicherung erstellt wurde.
  2. **Plugin-Abhängigkeit**: Wenn die Lösung kommerzielle Plugins enthält, die in Ihrer lokalen Umgebung nicht vorhanden sind, schlägt die Wiederherstellung fehl.

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

Wir hoffen, dass dieses Tutorial Ihnen hilft, das CRM 2.0-System erfolgreich bereitzustellen. Wenn Sie während des Vorgangs auf Probleme stoßen, können Sie uns jederzeit kontaktieren!
---

*Last updated: 2026-04-02*
