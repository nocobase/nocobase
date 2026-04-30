---
title: "Rollen und Berechtigungen"
description: "Beschreibung des Rollensystems im CRM-System: Welche Seiten jede Position einsehen und welche Daten sie bearbeiten kann."
keywords: "Rollenberechtigungen,Datenberechtigungen,Menüberechtigungen,Abteilungsrollen,NocoBase CRM"
---

# Rollen und Berechtigungen

> Personen mit unterschiedlichen Positionen sehen nach der Anmeldung am CRM unterschiedliche Menüs und können unterschiedliche Daten bearbeiten. Dieses Kapitel beantwortet die Frage: **„Was kann ich sehen, was kann ich tun?"**

## Welche Rolle habe ich?

Rollen werden auf zwei Wegen vergeben:
1. **Persönliche Rolle** — vom Administrator direkt Ihnen zugewiesen, sie folgt Ihnen
   ![08-roles-2026-04-07-01-45-14](https://static-docs.nocobase.com/08-roles-2026-04-07-01-45-14.png)

2. **Abteilungsrolle** — Ihre Abteilung ist mit einer Rolle verknüpft, beim Beitritt zur Abteilung wird sie automatisch geerbt

![08-roles-2026-04-07-01-46-57](https://static-docs.nocobase.com/08-roles-2026-04-07-01-46-57.png)

Beide werden überlagert wirksam. Wenn Sie z. B. persönlich die Rolle „Sales Rep" haben und zudem in die Abteilung Marketing aufgenommen werden, haben Sie gleichzeitig die Berechtigungen beider Rollen aus Vertrieb und Marketing.

![cn_08-roles](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles.png)

> \* **Sales Manager** und **Executive** sind nicht an Abteilungen gebunden und werden vom Administrator direkt einzelnen Personen zugewiesen.

---

## Welche Seiten kann jede Rolle sehen?

Nach der Anmeldung zeigt die Menüleiste nur die Seiten, auf die Sie Zugriff haben:

![cn_08-roles_1](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_1.png)

> ¹ Sales Reps sehen nur das persönliche Dashboard SalesRep, nicht die Ansichten SalesManager und Executive.

![08-roles-2026-04-07-01-47-48](https://static-docs.nocobase.com/08-roles-2026-04-07-01-47-48.png)

---

## Welche Daten kann ich bearbeiten?

### Kernlogik der Datenberechtigung

![cn_08-roles_2](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_2.png)

### Datenberechtigungen des Sales Rep

Dies ist die am häufigsten genutzte Rolle, daher der ausführliche Hinweis:

![cn_08-roles_3](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_3.png)

**Warum sind Leads für alle sichtbar?**
- Sie müssen „nicht zugewiesene" Leads sehen, um sie aktiv anzunehmen
- Bei Duplikatsprüfungen müssen Sie alle Daten sehen, um doppelte Erfassungen zu vermeiden
- Leads anderer Personen können Sie nur einsehen, aber nicht bearbeiten

![08-roles-2026-04-07-01-48-42](https://static-docs.nocobase.com/08-roles-2026-04-07-01-48-42.png)

**Warum sehen Sie nur Ihre eigenen Kunden?**
- Kunden sind Kernvermögen mit klarer Zuordnung
- Verhindert, dass Sie die Kontaktdaten anderer sehen
- Bei einer Übergabe wenden Sie sich an Ihre Managerin oder Ihren Manager

![08-roles-2026-04-07-01-50-37](https://static-docs.nocobase.com/08-roles-2026-04-07-01-50-37.png)

**² Kontakte folgen den Kunden**

Welche Kontakte Sie sehen können:
1. Die Kontakte, für die Sie direkt verantwortlich sind
2. **Alle** Kontakte unterhalb der Kunden, für die Sie verantwortlich sind (auch wenn sie von anderen erstellt wurden)

> Beispiel: Sie sind für den Kunden „Huawei" verantwortlich, dann können Sie alle Kontakte unter Huawei sehen, unabhängig davon, wer sie eingegeben hat.

![08-roles-2026-04-07-01-51-26](https://static-docs.nocobase.com/08-roles-2026-04-07-01-51-26.png)

### Datenberechtigungen anderer Rollen

| Rolle | Daten, die vollständig verwaltet werden können | Andere Daten |
|------|-----------------|---------|
| Sales Manager | Alle CRM-Daten | — |
| Executive | — | Alle nur lesen + exportieren |
| Finanzen | Bestellungen, Zahlungen, Wechselkurse, Angebote | Andere nur lesen |
| Marketing | Leads, Lead-Tags, Datenanalysetemplates | Andere nur lesen |
| Customer Success Manager | Kunden, Kontakte, Aktivitäten, Kommentare, Kundenzusammenführung | Andere nur lesen |
| Technischer Support | Aktivitäten, Kommentare (nur eigene erstellte) | Kontakte: nur eigene Verantwortliche sichtbar |
| Produkt | Produkte, Kategorien, gestaffelte Preise | Andere nur lesen |

---

## Duplikatsprüfung: das „Sehe-ich-nicht"-Problem lösen

Da Kundendaten nach Zuständigkeit isoliert sind, sehen Sie keine Kunden anderer Vertriebsmitarbeiter. Bevor Sie jedoch einen neuen Lead oder Kunden erfassen, müssen Sie prüfen, **ob bereits jemand anderes daran arbeitet**.

![cn_08-roles_4](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_4.png)

Die Seite zur Duplikatsprüfung unterstützt drei Suchen:

- **Lead-Duplikatsprüfung**: Eingabe von Name, Unternehmen, E-Mail oder Mobilnummer
- **Kunden-Duplikatsprüfung**: Eingabe von Unternehmensname oder Telefonnummer
- **Kontakt-Duplikatsprüfung**: Eingabe von Name, E-Mail oder Mobilnummer

Das Ergebnis der Duplikatsprüfung zeigt **wer verantwortlich ist**. Falls bereits ein Datensatz vorhanden ist, kontaktieren Sie die zuständige Kollegin oder den zuständigen Kollegen direkt zur Abstimmung, um Doppelarbeit zu vermeiden.

![08-roles-2026-04-07-01-52-51](https://static-docs.nocobase.com/08-roles-2026-04-07-01-52-51.gif)

---

## Häufige Fragen

**F: Was tun, wenn ich eine Seite nicht sehen kann?**

Das bedeutet, dass Ihre Rolle keinen Zugriff auf diese Seite hat. Wenn dies aus geschäftlichen Gründen erforderlich ist, wenden Sie sich an den Administrator zur Anpassung.

**F: Ich kann Daten sehen, aber es gibt keine Schaltflächen zum Bearbeiten/Löschen?**

Sie haben für diese Daten nur Leseberechtigung. Üblicherweise liegt das daran, dass Sie nicht der Owner sind. Aktionsschaltflächen ohne Berechtigung werden direkt ausgeblendet und nicht angezeigt.

**F: Ich bin gerade einer Abteilung beigetreten, wann werden die Berechtigungen wirksam?**

Sofort. Aktualisieren Sie die Seite, um das neue Menü zu sehen.

**F: Kann eine Person mehrere Rollen haben?**

Ja. Persönliche Rolle + Abteilungsrolle werden überlagert. Wenn Ihnen z. B. persönlich „Sales Rep" zugewiesen ist und Sie zusätzlich in die Abteilung Marketing aufgenommen werden, haben Sie gleichzeitig die Berechtigungen beider Rollen aus Vertrieb und Marketing.

## Verwandte Dokumente

- [Systemeinführung und Dashboards](./guide-overview) — Verwendung der einzelnen Dashboards
- [Lead-Verwaltung](./guide-leads) — Vollständiger Lead-Prozess
- [Kundenverwaltung](./guide-customers-emails) — Kunden-360-Ansicht
