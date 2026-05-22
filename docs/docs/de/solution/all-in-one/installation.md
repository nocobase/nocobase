---
title: "All-in-One-Business-System – Installation"
description: "Installation und Bereitstellung des All-in-One-Business-Systems: Restore über den Backup-Manager (Professional / Enterprise) oder Import einer SQL-Datei (Community). Erfordert PostgreSQL 16; DB_UNDERSCORED darf nicht auf true gesetzt sein."
keywords: "All-in-One-Business-System Installation, All-in-One, Backup-Restore, Backup-Manager, SQL-Import, PostgreSQL, NocoBase"
---

# Installation

Das All-in-One-Business-System umfasst sechs Module: **CRM, Vertriebsmanagement, Helpdesk, Projektmanagement, Anlagenverwaltung und HR**. Es stehen zwei Restore-Varianten bereit — wählen Sie die passende anhand Ihrer NocoBase-Edition und Ihres technischen Hintergrunds.

:::tip Voraussetzungen

- Sie verfügen über eine lauffähige NocoBase-Basisumgebung. Zur Installation der Hauptanwendung siehe die [offizielle Installationsanleitung](https://docs-cn.nocobase.com/welcome/getting-started/installation)
- NocoBase-Version **v2.1.0-alpha.34 oder höher**
- Eine der Backup-Dateien der All-in-One-Lösung wurde heruntergeladen:
  - **nbdata-Backup**: [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata) — für Methode 1
  - **SQL-Archiv**: [nocobase_all_in_one_sql_260521.zip](https://static-docs.nocobase.com/nocobase_all_in_one_sql_260521.zip) — für Methode 2

:::

:::warning Hinweis

- Die Lösung wurde auf **PostgreSQL 16** erstellt; die Umgebung muss PostgreSQL 16 verwenden
- **`DB_UNDERSCORED` darf nicht `true` sein** — prüfen Sie Ihre `docker-compose.yml`. Bei `true` schlägt das Restore fehl

:::

Faustregel: Mit Backup-Manager-Plug-in nehmen Sie Methode 1, ohne nehmen Sie Methode 2. Die aktuelle Version setzt auf **Backup-Restore**; spätere Versionen wechseln auf inkrementelle Migration zur leichteren Integration in bestehende NocoBase-Systeme.

---

## Methode 1: Backup-Manager-Restore (empfohlen für Professional / Enterprise)

Diese Variante nutzt das in NocoBase integrierte Plug-in „[Backup-Manager](https://docs-cn.nocobase.com/handbook/backups)“ für ein Ein-Klick-Restore über die Oberfläche. Sie ist am komfortabelsten, stellt aber strenge Anforderungen an Umgebung und Plug-ins.

### Eigenschaften

**Vorteile:**

- **Komfortable Bedienung** — vollständig über die UI, inklusive Wiederherstellung aller Plug-in-Konfigurationen
- **Vollständige Wiederherstellung** — alle Systemdateien werden wiederhergestellt, darunter Druckvorlagen, in Dateifeldern hochgeladene Dateien sowie Avatare der AI-Mitarbeiter

**Einschränkungen:**

- **Nur Professional / Enterprise** — der Backup-Manager ist ein Enterprise-Plug-in und in der Community Edition nicht verfügbar
- **Strenge Umgebungsanforderungen** — Datenbankversion, Groß-/Kleinschreibung und weitere Einstellungen müssen stark zur Backup-Quelle passen
- **Starke Plug-in-Abhängigkeit** — die im Backup enthaltenen kommerziellen Plug-ins müssen lokal ebenfalls vorhanden sein, sonst schlägt das Restore fehl

### Schritte

**Schritt 1: Anwendung mit dem `full`-Image starten**

Dringend empfohlen wird die `full`-Variante des Docker-Images; sie enthält Datenbank-Clients und alle Hilfsprogramme und erfordert keine zusätzliche Konfiguration:

```bash
docker pull nocobase/nocobase:alpha-full
```

Starten Sie anschließend Ihren NocoBase-Dienst mit diesem Image.

:::tip

Ohne das `full`-Image müssen Sie den `pg_dump`-Client manuell im Container installieren — ein aufwendiger und fehleranfälliger Vorgang.

:::

**Schritt 2: Plug-in „Backup-Manager“ aktivieren**

1. Melden Sie sich am NocoBase-System an
2. Öffnen Sie die **Plug-in-Verwaltung**
3. Suchen und aktivieren Sie das Plug-in **Backup-Manager**

**Schritt 3: Restore aus einer lokalen Backup-Datei**

1. Aktualisieren Sie die Seite, nachdem das Plug-in aktiviert ist
2. Navigieren Sie im linken Menü zu **Systemverwaltung / Backup-Manager**
3. Klicken Sie oben rechts auf **Aus lokalem Backup wiederherstellen**
4. Ziehen Sie die heruntergeladene Datei `nocobase_all_in_one_backup_260521.nbdata` in den Upload-Bereich
5. Klicken Sie auf **Absenden** und warten Sie auf den Abschluss — je nach Datenmenge wenige zehn Sekunden bis einige Minuten

### Hinweise

- **Datenbankkompatibilität** — PostgreSQL-Version, Zeichensatz und Groß-/Kleinschreibung müssen zur Backup-Quelle passen; insbesondere muss der `schema`-Name übereinstimmen
- **Kommerzielle Plug-ins** — alle im Backup verwendeten kommerziellen Plug-ins müssen lokal aktiviert sein, sonst bricht das Restore ab. Zur All-in-One-Lösung gehören unter anderem Backup-Manager, Mail-Manager, Audit-Log und AI-Mitarbeiter

---

## Methode 2: Direkter SQL-Import (universell, geeignet für die Community Edition)

Diese Methode greift direkt auf die Datenbank zu und umgeht damit den Backup-Manager — ohne Versions- oder Plug-in-Beschränkung.

### Eigenschaften

**Vorteile:**

- **Keine Versionsbeschränkung** — nutzbar von allen NocoBase-Anwendern, einschließlich Community Edition
- **Hohe Kompatibilität** — unabhängig vom integrierten `dump`-Werkzeug; ein funktionierender Datenbankzugriff genügt
- **Hohe Fehlertoleranz** — fehlende kommerzielle Plug-ins werden lokal nicht aktiviert, beeinträchtigen aber den Rest des Systems nicht

**Einschränkungen:**

- **Datenbankkenntnisse erforderlich** — z. B. das Ausführen einer `.sql`-Datei
- **Verlust von Systemdateien** — alle Systemdateien gehen verloren, darunter Druckvorlagen, in Dateifeldern hochgeladene Dateien sowie Avatare der AI-Mitarbeiter

### Schritte

**Schritt 1: Eine leere Datenbank vorbereiten**

Legen Sie eine neue, leere Datenbank (PostgreSQL 16) für die zu importierenden Daten an.

**Schritt 2: `.sql`-Datei in die Datenbank importieren**

Entpacken Sie das heruntergeladene `nocobase_all_in_one_sql_260521.zip`, um die `.sql`-Datei zu erhalten, und importieren Sie sie in die zuvor vorbereitete Datenbank. Zwei gängige Wege:

**Variante A: Über die Serverkonsole (Beispiel Docker)**

Wenn NocoBase und Datenbank per Docker betrieben werden, laden Sie die `.sql`-Datei auf den Server und importieren sie mit `docker exec`. Angenommen, der PostgreSQL-Container heißt `my-nocobase-db`:

```bash
# SQL-Datei in den Container kopieren
docker cp nocobase_all_in_one_sql_260521.sql my-nocobase-db:/tmp/
# Im Container den Import ausführen
docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_all_in_one_sql_260521.sql
```

**Variante B: Über einen entfernten Datenbankclient (Navicat o. Ä.)**

Wenn die Datenbank einen Port nach außen freigibt, verwenden Sie einen grafischen Client (Navicat, DBeaver, pgAdmin u. a.):

1. Rechtsklick auf die Zieldatenbank
2. **SQL-Datei ausführen** oder **SQL-Skript ausführen** wählen
3. Die entpackte `.sql`-Datei auswählen und ausführen

**Schritt 3: Datenbank anbinden und Anwendung starten**

Konfigurieren Sie die Startparameter von NocoBase (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` usw.) so, dass sie auf die soeben befüllte Datenbank zeigen, und starten Sie den NocoBase-Dienst normal.

### Hinweise

- **Datenbankrechte** — diese Methode erfordert ein Konto mit direktem Datenbankzugriff
- **Plug-in-Status** — nach erfolgreichem Import sind die Daten der kommerziellen Plug-ins vorhanden, die zugehörigen Funktionen bleiben ohne installiertes Plug-in jedoch unsichtbar. Die Anwendung stürzt nicht ab

---

## Vergleich der beiden Methoden

| Merkmal | Methode 1: Backup-Manager | Methode 2: Direkter SQL-Import |
| :--- | :--- | :--- |
| **Zielgruppe** | Professional / Enterprise | Alle Anwender (inkl. Community) |
| **Einfachheit** | ⭐⭐⭐⭐⭐ (UI-Bedienung) | ⭐⭐⭐ (Datenbankkenntnisse nötig) |
| **Umgebungsanforderungen** | Streng — Datenbank und Systemversion müssen stark übereinstimmen | Moderat — Datenbankkompatibilität genügt |
| **Plug-in-Abhängigkeit** | Stark — fehlende Plug-ins führen zum Restore-Abbruch | Daten können unabhängig importiert werden, ohne entsprechende Plug-ins sind die zugehörigen Funktionen nicht nutzbar |
| **Systemdateien** | Vollständig erhalten (Druckvorlagen, Uploads, Avatare usw.) | Gehen verloren (Druckvorlagen, Uploads, Avatare usw.) |
| **Empfohlenes Szenario** | Enterprise-Anwender mit kontrollierter Umgebung | Einzelne Plug-ins fehlen, Bedarf an Kompatibilität, Community Edition |

---

## Erforderliche Konfiguration nach der Installation

Nach abgeschlossenem Restore ist das System bereits aufrufbar, zwei Konfigurationen zeigen jedoch auf **unsere Demo-Umgebung** und müssen auf Ihre eigenen Werte umgestellt werden.

### 1. Datei-Speicher-Engine (OSS / lokal)

Im Demo-Backup verweist die voreingestellte Speicher-Engine auf das Aliyun OSS unserer Demo-Umgebung. Der Access Key ist nicht öffentlich, daher schlagen alle Uploads über Dateifelder, Druckvorlagen sowie Avatare der AI-Mitarbeiter fehl.

In den meisten Fällen reicht der Wechsel auf den lokalen Speicher. Eigenes OSS lohnt sich erst bei CDN-Beschleunigung oder großen Dateien.

**Wechsel-Schritte:**

1. Öffnen Sie **Plug-in-Verwaltung / Dateimanager** (oder direkt `/admin/settings/file-manager`)

2. **Variante A — Lokalen Speicher verwenden** (am einfachsten, für Self-Hosting geeignet):

   - Suchen Sie den automatisch angelegten Eintrag **Local Storage (lokaler Speicher)**
   - Klicken Sie auf **Bearbeiten**, aktivieren Sie unten im Konfigurationspanel **Als Standard-Speicher-Engine festlegen** und bestätigen Sie mit **Absenden**

   ![Allgemeine Konfiguration der Speicher-Engine (unten „Als Standard-Speicher-Engine festlegen“)](https://static-docs.nocobase.com/20240529115151.png)

   :::warning Hinweis

   Bei Docker-Deployments liegt der lokale Speicher im Container; beim Löschen des Containers gehen die Dateien verloren. In Produktion empfiehlt sich ein gemountetes Volume oder ein Cloud-Speicher.

   :::

3. **Variante B — Eigenes OSS / S3 / COS verwenden**:

   - Klicken Sie auf **Neu hinzufügen** und wählen Sie den passenden Typ (Aliyun OSS / Amazon S3 / Tencent COS / S3 Pro)
   - Tragen Sie Access Key, Bucket, Region, Domain usw. ein, aktivieren Sie **Als Standard-Speicher-Engine festlegen** und bestätigen Sie

   ![Beispielkonfiguration einer Aliyun-OSS-Speicher-Engine](https://static-docs.nocobase.com/20240712220011.png)

4. Löschen oder deaktivieren Sie den vorgegebenen Demo-OSS-Eintrag, um Fehlbenutzung zu vermeiden

Eine detaillierte Parameterbeschreibung finden Sie in der [Speicher-Engine Übersicht](../../file-manager/storage/index.md).

### 2. LLM-Service-Keys für AI Employees

Das Demo-Backup enthält voreingestellte LLM-Services (OpenAI, Claude, Gemini, DeepSeek, Qwen, Kimi u. a.) mit unseren API-Keys, **die nicht öffentlich gültig sind**. Die AI-Employee-Funktionen sind erst nach dem Austausch nutzbar.

**Konfigurations-Schritte:**

1. Öffnen Sie **Systemeinstellungen / AI Employees / LLM service** (oder `/admin/settings/ai/llm-services`)

   ![Aufruf der LLM-service-Konfiguration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

2. In der Liste der voreingestellten Services können Sie per Drag & Drop sortieren und über den Schalter **Enabled** starten/stoppen

   ![LLM-Service-Liste (Aktivieren + Sortieren)](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

3. Für jeden zu nutzenden Service:

   - Auf **Bearbeiten** klicken
   - **API Key** durch den eigenen Schlüssel ersetzen (über das jeweilige Anbieterkonto: OpenAI, Anthropic, Google AI Studio, DeepSeek, Qwen, Kimi u. a.)
   - Bei Proxy oder Inland-Relay die **Base URL** anpassen
   - Unter **Enabled Models** nur die benötigten Modelle behalten

   ![LLM-Service bearbeiten (API Key, Base URL, Enabled Models)](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

4. Mit **Test flight** unten die Verbindung testen, danach mit **Submit** speichern

   ![Test flight — Verbindung testen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

5. Nicht benötigte Services einfach auf Disabled stellen, ein Löschen ist nicht nötig

Detaillierte Konfiguration siehe [LLM-Service konfigurieren](../../ai-employees/features/llm-service.md).

:::tip

Diese beiden Punkte sind nach dem Demo-Restore zwingend anzupassen. Weitere Einstellungen (Site-Logo, SMTP, Enterprise-Plug-ins usw.) nach Bedarf.

:::

---

## Häufige Fragen

### Funktioniert die Professional Edition? Gibt es Fehler?

Sie können sie direkt einsetzen, ohne dass Fehler auftreten. Die Demo verwendet einige Enterprise-Plug-ins (Mail-Manager, Audit-Log, AI Employees u. a.). Fehlen diese in der Professional Edition, werden die zugehörigen Einstiegspunkte ausgeblendet, die übrigen Module bleiben uneingeschränkt nutzbar. Beispielsweise verschwindet der Einstieg zum Audit-Log, während CRM, Vertrieb, Tickets, Projekte, Anlagen und HR vollständig funktionieren.

### Welche Version sollte nach dem Restore verwendet werden?

Empfohlen wird das neueste `alpha-full`-Image (`nocobase/nocobase:alpha-full`). Das `full`-Image enthält Datenbank-Clients und weitere Abhängigkeiten und vermeidet Restore-Fehler durch fehlende Werkzeuge.

### Nach dem Restore wird das Logo nicht angezeigt?

Das Logo der Demo auf unserer Website ist domainbeschränkt und lässt sich unter Ihrer eigenen Domain nicht laden. Laden Sie unter **Systemeinstellungen** Ihr eigenes Logo hoch.

### Fehler beim Dateiupload (OSS-Key-Fehler)?

Nach der SQL-Installation kann der Dateiupload OSS-bezogene Fehler verursachen. Öffnen Sie **Plug-in-Verwaltung / Dateimanager** und setzen Sie **Local Storage (lokaler Speicher)** als Standard-Speicher. Nach dem Speichern funktioniert der Upload wieder.

Eine detaillierte Anleitung finden Sie oben im Abschnitt [Datei-Speicher-Engine](#1-datei-speicher-engine-oss--lokal).

### Sprachwechsel?

Die All-in-One-Lösung wurde in mehr als 20 Sprachen lokalisiert (Namespace `nb_demo`). Nach dem Restore ist Chinesisch voreingestellt; wechseln Sie unter **Systemeinstellungen / entsprechende Sprache aktivieren**.

### Wie funktioniert ein inkrementelles Upgrade?

Aktuell ist das Upgrade ein vollständiger Austausch — eigene Anpassungen werden überschrieben. Vor dem Upgrade unbedingt sichern. Eine inkrementelle Migration ist in Planung und wird zuerst Professional / Enterprise unterstützen. Für die Community Edition ist eine Unterstützung wegen des fehlenden Migration-Manager-Plug-ins vorerst schwierig.
