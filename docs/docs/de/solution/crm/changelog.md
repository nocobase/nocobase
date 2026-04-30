# Änderungsprotokoll

Diese Seite dokumentiert die Änderungen der einzelnen Versionen der CRM-Lösung. Bei jeder Veröffentlichung eines neuen Backups wird oben auf dieser Seite ein neuer Eintrag hinzugefügt.

---

## 2026-04-05

**Backup-Dateien**:
- [nocobase_crm_v2_backup_260406.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260406.nbdata)
- [nocobase_crm_v2_sql_260406.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260406.zip)

**Änderungen**:
- Fehler bei der Anzeige der Tabellen-Summary behoben
- Konfiguration der Rollenberechtigungen abgeschlossen
- Neue globale Suchseite (Lookup) hinzugefügt, die das gleichzeitige Suchen von Datensätzen aus mehreren Tabellen auf einer einzelnen Seite ermöglicht
- Fehler beim Installationsskript behoben, bei dem `plugin-disable-pm-add` nicht gefunden werden konnte
- Schaltfläche zur Lead-Zuweisung hinzugefügt
- Fehler beim Klicken auf den Filter für Verkaufschancen behoben

---

## 2026-03-27

**Backup-Dateien**:
- [nocobase_crm_v2_backup_260327.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260327.nbdata)
- [nocobase_crm_v2_sql_260327.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260327.zip)

**Änderungen**:

**Dashboard-Optimierung**
- Neues Dashboard im V1-Stil hinzugefügt
- Stil des alten Dashboards optimiert
- Klickereignisse für Diagramme und KPI-Karten hinzugefügt: Unterstützung von parameterbasierter Navigation und Popup-Durchgriff

**Fehlerbehebungen**
- Fehler behoben, bei dem zwei JS Blocks im Pipeline-Tab der Opportunities nicht zusammen filterbar waren

**Verbesserungen am Angebot**
- Genehmigungsprozess für Angebote hinzugefügt
- Testdaten für Genehmigungen ergänzt

**Kundenverwaltung**
- Funktion zum Zusammenführen von Kunden und entsprechende Seiten hinzugefügt

**Stammdaten**
- Abteilungsdaten ergänzt

---

## 2026-02-23

**Backup-Dateien**:
- nocobase_crm_v2_backup_260223.nbdata
- nocobase_crm_v2_sql_260223.zip

**Änderungen**:
- Erstveröffentlichung von CRM 2.0
- 7 Kernmodule: Leads, Kontakte, Kunden, Verkaufschancen, Angebote, Bestellungen, Aktivitäten
- 5 AI Employees: Scout (Lead-Scoring), Viz (Datenanalysen), Ellis (E-Mail-Assistent), Dex (Kundengesundheit), Lexi (Übersetzung)
- Unterstützung mehrerer Währungen und Wechselkursverwaltung
- 15 Dashboards (drei Perspektiven: Sales Manager / Sales Rep / Executive)
