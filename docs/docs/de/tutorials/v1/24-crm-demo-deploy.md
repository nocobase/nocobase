# Anleitung zum Deployment der CRM-Demo

Damit Sie diese Demo schnell und reibungslos in Ihrer eigenen NocoBase-Umgebung wiederherstellen können, bieten wir zwei Wege an. Wählen Sie den, der zu Ihrer Edition und Ihrem technischen Hintergrund passt.

Bevor Sie starten, stellen Sie sicher, dass

- Sie eine grundlegende NocoBase-Umgebung betreiben. Zur Installation siehe die [offizielle Installationsdokumentation](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- Sie die passenden Demo-Dateien (deutsche Version) heruntergeladen haben:
  - **Backup-Datei** (ca. 21,2 MB): [nocobase_crm_demo_cn.nbdata](https://static-docs.nocobase.com/nocobase_crm_demo_cn.nbdata) - für Methode 1
  - **SQL-Datei** (ca. 9 MB komprimiert): [nocobase_crm_demo_cn.zip](https://static-docs.nocobase.com/nocobase_crm_demo_cn.zip) - für Methode 2

**Wichtiger Hinweis**: Diese Demo wurde auf Basis von **PostgreSQL** erstellt. Stellen Sie sicher, dass Ihre Umgebung PostgreSQL nutzt.

---

### Methode 1: Wiederherstellung mit dem Backup-Manager (für Pro/Enterprise empfohlen)

Diese Methode nutzt das eingebaute Plugin „[Backup-Manager](https://docs-cn.nocobase.com/handbook/backups)" (Pro/Enterprise) und ist mit einem Klick durchführbar. Sie hat allerdings einige Anforderungen.

#### Eigenschaften

* **Vorteile**:
  1. **Einfache Bedienung**: Komplette Wiederherstellung im UI, inklusive aller Plugin-Konfigurationen.
  2. **Vollständig**: **Stellt alle Systemdateien wieder her**, einschließlich Druckvorlagen und Dateifelddaten - die Demo ist vollständig funktionsfähig.
* **Einschränkungen**:
  1. **Nur Pro/Enterprise**: Der „Backup-Manager" ist ein Enterprise-Plugin, ausschließlich für Pro/Enterprise-Editions.
  2. **Strenge Umgebungsanforderungen**: Datenbank (Version, Case-Sensitivity etc.) muss kompatibel zur Quellumgebung sein.
  3. **Plugin-Abhängigkeit**: Fehlen kommerzielle Plugins, schlägt die Wiederherstellung fehl.

#### Schritte

**Schritt 1: [Stark empfohlen] Mit dem `full`-Image starten**

Um Fehler durch fehlende DB-Clients zu vermeiden, empfehlen wir das `full`-Docker-Image. Es enthält alle nötigen Tools. (Hinweis: Das Image basiert auf 1.9.0-alpha.1, achten Sie auf Versionskompatibilität.)

Image-Pull-Beispiel:

```bash
docker pull nocobase/nocobase:1.9.0-alpha.3-full
```

Mit diesem Image starten Sie Ihren NocoBase-Dienst.

> **Hinweis**: Ohne `full`-Image müssen Sie ggf. `pg_dump` manuell im Container installieren - umständlich und fehleranfällig.

**Schritt 2: Plugin „Backup-Manager" aktivieren**

1. Im NocoBase-System anmelden.
2. Zu **`Plugin-Verwaltung`** wechseln.
3. **`Backup-Manager`** finden und aktivieren.

![20250711014113](https://static-docs.nocobase.com/20250711014113.png)

**Schritt 3: Aus lokaler Backup-Datei wiederherstellen**

1. Nach Plugin-Aktivierung Seite neu laden.
2. Linkes Menü: **`Systemverwaltung`** -\> **`Backup-Manager`**.
3. Oben rechts auf **`Aus lokaler Sicherung wiederherstellen`** klicken.
   ![20250711014216](https://static-docs.nocobase.com/20250711014216.png)
4. Demo-Backup-Datei (`.zip`) per Drag-and-Drop hochladen.
5. **`Senden`** klicken und auf den Abschluss warten - dauert wenige Sekunden bis Minuten.
   ![20250711014250](https://static-docs.nocobase.com/20250711014250.png)

#### ⚠️ Hinweise

* **Datenbankkompatibilität**: PostgreSQL-**Version, Zeichensatz, Case-Sensitivity** müssen zum Backup passen, insbesondere identische **Schema-Namen**.
* **Kommerzielle Plugins**: Stellen Sie sicher, dass alle benötigten kommerziellen Plugins installiert und aktiviert sind, andernfalls bricht die Wiederherstellung ab.

---

### Methode 2: SQL-Datei direkt importieren (allgemein, eher für Community-Edition geeignet)

Diese Methode importiert Daten direkt in die Datenbank und umgeht das Backup-Manager-Plugin - keine Pro/Enterprise-Beschränkung.

#### Eigenschaften

* **Vorteile**:
  1. **Keine Editions-Beschränkung**: Für alle Anwender (auch Community).
  2. **Hohe Kompatibilität**: Kein App-`dump`-Tool nötig - Datenbankzugriff genügt.
  3. **Hohe Toleranz**: Fehlt ein kommerzielles Plugin (z. B. ECharts), bleiben die Daten erhalten, nur die zugehörigen Funktionen sind deaktiviert. Die App startet trotzdem.
* **Einschränkungen**:
  1. **Datenbankkenntnisse erforderlich**: Sie müssen z. B. eine `.sql`-Datei importieren können.
  2. **⚠️ Systemdateien gehen verloren**: **Diese Methode verliert alle Systemdateien**, einschließlich Druckvorlagen, Dateifeld-Uploads etc. Folgen:
     - Druckvorlagenfunktion nicht nutzbar
     - Bilder/Dokumente fehlen
     - Funktionen mit Dateifeldern eingeschränkt

#### Schritte

**Schritt 1: Saubere Datenbank vorbereiten**

Legen Sie eine neue, leere Datenbank für die Demo-Daten an.

**Schritt 2: `.sql`-Datei importieren**

Nehmen Sie die bereitgestellte `.sql`-Datei und importieren Sie sie in die vorbereitete Datenbank. Optionen:

* **Option A: Über die Server-Kommandozeile (Beispiel: Docker)**
  Falls NocoBase und DB per Docker laufen, laden Sie die SQL-Datei hoch und importieren mit `docker exec`. Annahme: PostgreSQL-Container `my-nocobase-db`, Datei `crm_demo.sql`:

  ```bash
  # SQL-Datei in den Container kopieren
  docker cp crm_demo.sql my-nocobase-db:/tmp/
  # In den Container und importieren
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/crm_demo.sql
  ```
* **Option B: Über einen Remote-DB-Client**
  Falls die DB einen Port nach außen freigibt, verbinden Sie sich mit DBeaver, Navicat, pgAdmin etc., öffnen ein Query-Fenster, fügen den `.sql`-Inhalt ein und führen ihn aus.

**Schritt 3: Datenbank verbinden und App starten**

Konfigurieren Sie die NocoBase-Startparameter (Umgebungsvariablen `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`) so, dass sie auf die importierte DB zeigen, und starten Sie den Dienst.

![img_v3_02o3_eb637bd2-88c3-400b-8421-1ac2057d1aag](https://static-docs.nocobase.com/img_v3_02o3_eb637bd2-88c3-400b-8421-1ac2057d1aag.png)

#### ⚠️ Hinweise

* **DB-Rechte**: Sie benötigen direkten DB-Zugriff (Account/Password).
* **Plugin-Status**: Nach erfolgreichem Import liegen Daten kommerzieller Plugins zwar vor, ohne installierte/aktivierte Plugins sind die zugehörigen Funktionen aber nicht nutzbar - die App stürzt nicht ab.

---

### Zusammenfassung und Vergleich


| Eigenschaft        | Methode 1: Backup-Manager                                                                  | Methode 2: SQL-Direktimport                                                                                                            |
| :----------------- | :----------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **Geeignet für**   | **Pro/Enterprise**-Anwender                                                                | **Alle Anwender** (auch Community)                                                                                                     |
| **Bedienkomfort**  | ⭐⭐⭐⭐⭐ (sehr einfach im UI)                                                            | ⭐⭐⭐ (DB-Grundkenntnisse nötig)                                                                                                      |
| **Anforderungen**  | **Streng**, DB- und Systemversion müssen kompatibel sein                                   | **Üblich**, DB-Kompatibilität reicht                                                                                                  |
| **Plugin-Abh.**    | **Stark**, Wiederherstellung prüft Plugins; fehlende Plugins führen zum **Fehlschlag**.    | **Funktional abhängig**: Daten werden importiert, doch Funktionen ohne Plugins sind **vollständig deaktiviert**.                       |
| **Systemdateien**  | **✅ Vollständig erhalten** (Druckvorlagen, Uploads etc.)                                  | **❌ Gehen verloren** (Druckvorlagen, Uploads etc.)                                                                                   |
| **Empfohlen für**  | Enterprise-Nutzer mit kontrollierter Umgebung und voller Funktionalität                    | Anwender ohne alle Plugins, mit Fokus auf Kompatibilität und Flexibilität - akzeptieren Verlust von Dateifunktionen                    |

Wir hoffen, dieser Leitfaden hilft Ihnen, die CRM-Demo erfolgreich zu deployen. Bei Problemen melden Sie sich jederzeit!
