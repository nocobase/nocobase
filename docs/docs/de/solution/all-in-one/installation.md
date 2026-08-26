---
title: "All-in-One-Business-System – Installation"
description: "Installation und Bereitstellung des All-in-One-Business-Systems: Ein-Klick-Restore einer nbdata-Backup-Datei über den Backup-Manager. Erfordert NocoBase v2.1.0-alpha.40 oder höher, PostgreSQL 16; DB_UNDERSCORED darf nicht auf true gesetzt sein."
keywords: "All-in-One-Business-System Installation, All-in-One, Backup-Restore, Backup-Manager, nbdata, PostgreSQL, NocoBase"
---

# Installation

Das All-in-One-Business-System umfasst sechs Module: **CRM, Vertriebsmanagement, Helpdesk, Projektmanagement, Anlagenverwaltung und HR**. Mit dem in NocoBase integrierten Plug-in „Backup-Manager" stellen Sie die `.nbdata`-Backup-Datei per Klick wieder her und erhalten den kompletten Datenbestand.

:::tip Voraussetzungen

- Sie verfügen über eine lauffähige NocoBase-Basisumgebung. Zur Installation der Hauptanwendung siehe die [offizielle Installationsanleitung](https://docs-cn.nocobase.com/welcome/getting-started/installation)
- NocoBase-Version **v2.1.0-alpha.40 oder höher** (Open-Source seit dieser Version, in der Community-Edition verfügbar)
- Die Backup-Datei wurde heruntergeladen: [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata)

:::

:::warning Hinweis

- Die Lösung wurde auf **PostgreSQL 16** erstellt; die Umgebung muss PostgreSQL 16 verwenden
- **`DB_UNDERSCORED` darf nicht `true` sein** — prüfen Sie Ihre `docker-compose.yml`. Bei `true` schlägt das Restore fehl
- **Die Wiederherstellung überschreibt ALLE Daten der Zielanwendung** — wenn die Zielumgebung bereits Daten enthält, sichern Sie zuerst die aktuelle Anwendung und führen Sie die Wiederherstellung mit Vorsicht aus

:::

Die aktuelle Version wird per **Backup-Restore** ausgeliefert; spätere Versionen wechseln auf inkrementelle Migration zur leichteren Integration in bestehende NocoBase-Systeme.

---

## Schritte

### Schritt 1: Anwendung mit dem `full`-Image starten

Dringend empfohlen wird die `full`-Variante des Docker-Images; sie enthält Datenbank-Clients und alle Hilfsprogramme und erfordert keine zusätzliche Konfiguration:

```bash
docker pull nocobase/nocobase:alpha-full
```

Starten Sie anschließend Ihren NocoBase-Dienst mit diesem Image.

:::tip

Ohne das `full`-Image müssen Sie den `pg_dump`-Client manuell im Container installieren — ein aufwendiger und fehleranfälliger Vorgang.

:::

### Schritt 2: Plug-in „Backup-Manager" aktivieren

1. Melden Sie sich am NocoBase-System an
2. Öffnen Sie die **Plug-in-Verwaltung**
3. Suchen und aktivieren Sie das Plug-in **Backup-Manager**

### Schritt 3: Restore aus einer lokalen Backup-Datei

1. Aktualisieren Sie die Seite, nachdem das Plug-in aktiviert ist
2. Navigieren Sie im linken Menü zu **Systemverwaltung / Backup-Manager**

   ![Backup-Manager-Hauptansicht](https://static-docs.nocobase.com/202510302154966.png)

3. Klicken Sie oben rechts auf **Aus lokalem Backup wiederherstellen**
4. Ziehen Sie die heruntergeladene Datei `nocobase_all_in_one_backup_260521.nbdata` in den Upload-Bereich

   ![Aus lokaler Sicherungsdatei wiederherstellen (Upload-Dialog)](https://static-docs.nocobase.com/202510302155602.png)

5. Klicken Sie auf **Absenden** und warten Sie auf den Abschluss — je nach Datenmenge wenige zehn Sekunden bis einige Minuten

---

## Hinweise

- **Datenbankkompatibilität** — PostgreSQL-Version, Zeichensatz und Groß-/Kleinschreibung müssen zur Backup-Quelle passen; insbesondere muss der `schema`-Name übereinstimmen
- **Kommerzielle Plug-ins** — alle im Backup verwendeten kommerziellen Plug-ins müssen lokal aktiviert sein, sonst bricht das Restore ab. Zur All-in-One-Lösung gehören kommerzielle Plug-ins wie Mail-Manager, Audit-Log und AI-Mitarbeiter. Fehlen diese in der Community Edition, werden die zugehörigen Einstiegspunkte ausgeblendet, die übrigen Module bleiben uneingeschränkt nutzbar

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

   ![Allgemeine Konfiguration der Speicher-Engine (unten „Als Standard-Speicher-Engine festlegen")](https://static-docs.nocobase.com/20240529115151.png)

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

### Lässt sich die Community Edition verwenden? Gibt es Fehler?

Ja, sie lässt sich direkt einsetzen, ohne dass Fehler auftreten. Der Backup-Manager ist ab `v2.1.0-alpha.40` Open Source und in der Community Edition installierbar. Die Demo verwendet einige Enterprise-Plug-ins (Mail-Manager, Audit-Log, AI Employees u. a.). Fehlen diese in der Community Edition, werden die zugehörigen Einstiegspunkte ausgeblendet, die übrigen Module bleiben uneingeschränkt nutzbar. Beispielsweise verschwindet der Einstieg zum Audit-Log, während CRM, Vertrieb, Tickets, Projekte, Anlagen und HR vollständig funktionieren.

### Welche Version sollte nach dem Restore verwendet werden?

Empfohlen wird das neueste `alpha-full`-Image (`nocobase/nocobase:alpha-full`). Das `full`-Image enthält Datenbank-Clients und weitere Abhängigkeiten und vermeidet Restore-Fehler durch fehlende Werkzeuge.

### Nach dem Restore wird das Logo nicht angezeigt?

Das Logo der Demo auf unserer Website ist domainbeschränkt und lässt sich unter Ihrer eigenen Domain nicht laden. Laden Sie unter **Systemeinstellungen** Ihr eigenes Logo hoch.

### Fehler beim Dateiupload (OSS-Key-Fehler)?

Die voreingestellte Speicher-Engine im Demo-Backup verweist auf unser Demo-OSS, dessen Key nicht öffentlich ist. Öffnen Sie **Plug-in-Verwaltung / Dateimanager** und setzen Sie **Local Storage (lokaler Speicher)** als Standard-Speicher. Nach dem Speichern funktioniert der Upload wieder.

Eine detaillierte Anleitung finden Sie oben im Abschnitt [Datei-Speicher-Engine](#1-datei-speicher-engine-oss--lokal).

### Sprachwechsel?

Die All-in-One-Lösung wurde in mehr als 20 Sprachen lokalisiert (Namespace `nb_demo`). Nach dem Restore ist Chinesisch voreingestellt; wechseln Sie unter **Systemeinstellungen / entsprechende Sprache aktivieren**.

### Wie funktioniert ein inkrementelles Upgrade?

Aktuell ist das Upgrade ein vollständiger Austausch — eigene Anpassungen werden überschrieben. Vor dem Upgrade unbedingt sichern. Eine inkrementelle Migration ist in Planung.
