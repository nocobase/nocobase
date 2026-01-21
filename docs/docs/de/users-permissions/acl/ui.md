---
pkg: '@nocobase/plugin-acl'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Anwendung in der Benutzeroberfläche

## Datenblock-Berechtigungen

Die Sichtbarkeit von Datenblöcken in einer `Sammlung` wird durch die Berechtigungen für die Aktion „Anzeigen“ gesteuert. Dabei haben individuelle Konfigurationen Vorrang vor globalen Einstellungen.

Wie im folgenden Beispiel gezeigt: Unter den globalen Berechtigungen hat die Rolle „Admin“ vollen Zugriff, aber für die `Sammlung` „Bestellungen“ können individuelle Berechtigungen konfiguriert sein, die sie unsichtbar machen.

Die globale Berechtigungskonfiguration sieht wie folgt aus:

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

Die individuelle Berechtigungskonfiguration für die `Sammlung` „Bestellungen“ sieht wie folgt aus:

![](https://static-docs.nocobase.com/a88caba1cad47001c1610bf402a4a2c1.png)

In der Benutzeroberfläche werden alle Blöcke der `Sammlung` „Bestellungen“ nicht angezeigt.

Der vollständige Konfigurationsprozess ist wie folgt:

![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)

## Feldberechtigungen

**Anzeigen**: Legt fest, ob bestimmte Felder auf Feldebene sichtbar sind. So können Sie steuern, welche Felder für bestimmte Rollen innerhalb der `Sammlung` „Bestellungen“ sichtbar sind.

![](https://static-docs.nocobase.com/30dea84d95039e6f7b180955a6cf.png)

In der Benutzeroberfläche werden im Block der `Sammlung` „Bestellungen“ nur Felder mit konfigurierten Berechtigungen angezeigt. Systemfelder (Id, Erstellt am, Zuletzt aktualisiert am) behalten die Anzeigeberechtigung auch ohne spezifische Konfiguration bei.

![](https://static-docs.nocobase.com/40cc49b517efe701147fd2e799e79dcc.png)

- **Bearbeiten**: Steuert, ob Felder bearbeitet und gespeichert (aktualisiert) werden können.

  Konfigurieren Sie wie abgebildet die Bearbeitungsberechtigungen für Felder der `Sammlung` „Bestellungen“ (Menge und zugehörige Artikel haben Bearbeitungsberechtigungen):

  ![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)

  In der Benutzeroberfläche werden im Formularblock für die Bearbeitungsaktion innerhalb des Blocks der `Sammlung` „Bestellungen“ nur Felder mit Bearbeitungsberechtigungen angezeigt.

  ![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

  Der vollständige Konfigurationsprozess ist wie folgt:

  ![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)

- **Hinzufügen**: Legt fest, ob Felder hinzugefügt (erstellt) werden können.

  Konfigurieren Sie wie abgebildet die Hinzufügeberechtigungen für Felder der `Sammlung` „Bestellungen“ (Bestellnummer, Menge, Artikel und Sendung haben Hinzufügeberechtigungen):

  ![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

  In der Benutzeroberfläche werden im Formularblock für die Hinzufügeaktion innerhalb des Blocks der `Sammlung` „Bestellungen“ nur Felder mit Hinzufügeberechtigungen angezeigt.

  ![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- **Exportieren**: Steuert, ob Felder exportiert werden können.
- **Importieren**: Steuert, ob Felder den Import unterstützen.

## Aktionsberechtigungen

Individuell konfigurierte Berechtigungen haben die höchste Priorität. Wenn spezifische Berechtigungen konfiguriert sind, überschreiben sie die globalen Einstellungen; andernfalls werden die globalen Einstellungen angewendet.

- **Hinzufügen**: Steuert, ob die Schaltfläche für die Hinzufügeaktion innerhalb eines Blocks sichtbar ist.

  Konfigurieren Sie wie abgebildet individuelle Aktionsberechtigungen für die `Sammlung` „Bestellungen“, um das Hinzufügen zu erlauben:

  ![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

  Wenn die Hinzufügeaktion erlaubt ist, erscheint die Schaltfläche „Hinzufügen“ im Aktionsbereich des Blocks der `Sammlung` „Bestellungen“ in der Benutzeroberfläche.

  ![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- **Anzeigen**: Legt fest, ob der Datenblock sichtbar ist.

  Die globale Berechtigungskonfiguration sieht wie folgt aus (keine Anzeigeberechtigung):

  ![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

  Die individuelle Berechtigungskonfiguration für die `Sammlung` „Bestellungen“ sieht wie folgt aus:

  ![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

  In der Benutzeroberfläche bleiben die Datenblöcke für alle anderen `Sammlungen` ausgeblendet, aber der Block der `Sammlung` „Bestellungen“ wird angezeigt.

  Der vollständige Beispiel-Konfigurationsprozess ist wie folgt:

  ![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- **Bearbeiten**: Steuert, ob die Schaltfläche für die Bearbeitungsaktion innerhalb eines Blocks angezeigt wird.

  ![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

  Aktionsberechtigungen können durch die Festlegung des Datenbereichs weiter verfeinert werden.

  Zum Beispiel können Sie in der `Sammlung` „Bestellungen“ festlegen, dass Benutzer nur ihre eigenen Daten bearbeiten dürfen:

  ![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- **Löschen**: Steuert, ob die Schaltfläche für die Löschaktion innerhalb eines Blocks sichtbar ist.

  ![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- **Exportieren**: Steuert, ob die Schaltfläche für die Exportaktion innerhalb eines Blocks sichtbar ist.

- **Importieren**: Steuert, ob die Schaltfläche für die Importaktion innerhalb eines Blocks sichtbar ist.

## Beziehungsberechtigungen

### Als Feld

- Die Berechtigungen eines Beziehungsfeldes werden durch die Feldberechtigungen der Quell-`Sammlung` gesteuert. Dies regelt, ob die gesamte Beziehungsfeldkomponente angezeigt wird.

Zum Beispiel hat in der `Sammlung` „Bestellungen“ das Beziehungsfeld „Kunde“ nur Anzeige-, Import- und Exportberechtigungen.

![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

In der Benutzeroberfläche bedeutet dies, dass das Beziehungsfeld „Kunde“ in den Hinzufüge- und Bearbeitungsaktionsblöcken der `Sammlung` „Bestellungen“ nicht angezeigt wird.

Der vollständige Beispiel-Konfigurationsprozess ist wie folgt:

![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- Die Berechtigungen für Felder innerhalb der Beziehungsfeldkomponente (z. B. einer Untertabelle oder eines Unterformulars) werden durch die Berechtigungen der Ziel-`Sammlung` bestimmt.

Wenn die Beziehungsfeldkomponente ein Unterformular ist:

Wie unten dargestellt, hat das Beziehungsfeld „Kunde“ in der `Sammlung` „Bestellungen“ alle Berechtigungen, während die `Sammlung` „Kunden“ selbst auf schreibgeschützt eingestellt ist.

Die individuelle Berechtigungskonfiguration für die `Sammlung` „Bestellungen“ sieht wie folgt aus, wobei das Beziehungsfeld „Kunde“ alle Feldberechtigungen besitzt:

![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)

Die individuelle Berechtigungskonfiguration für die `Sammlung` „Kunden“ sieht wie folgt aus, wobei die Felder in der `Sammlung` „Kunden“ nur Anzeigeberechtigungen haben:

![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

In der Benutzeroberfläche ist das Beziehungsfeld „Kunde“ im Block der `Sammlung` „Bestellungen“ sichtbar. Wenn jedoch zu einem Unterformular gewechselt wird, sind die Felder innerhalb des Unterformulars in der Detailansicht sichtbar, werden aber bei den Aktionen „Hinzufügen“ und „Bearbeiten“ nicht angezeigt.

Der vollständige Beispiel-Konfigurationsprozess ist wie folgt:

![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

Um die Berechtigungen für Felder innerhalb des Unterformulars weiter zu steuern, können Sie einzelnen Feldern Berechtigungen erteilen.

Wie abgebildet ist die `Sammlung` „Kunden“ mit individuellen Feldberechtigungen konfiguriert (Kundenname ist nicht sichtbar und nicht bearbeitbar).

![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

Der vollständige Beispiel-Konfigurationsprozess ist wie folgt:

![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

Wenn die Beziehungsfeldkomponente eine Untertabelle ist, ist die Situation konsistent mit der eines Unterformulars:

Wie abgebildet hat das Beziehungsfeld „Sendung“ in der `Sammlung` „Bestellungen“ alle Berechtigungen, während die `Sammlung` „Sendungen“ auf schreibgeschützt eingestellt ist.

In der Benutzeroberfläche ist dieses Beziehungsfeld sichtbar. Wenn jedoch zu einer Untertabelle gewechselt wird, sind die Felder innerhalb der Untertabelle in der Anzeigeaktion sichtbar, aber nicht in den Hinzufüge- und Bearbeitungsaktionen.

![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

Um die Berechtigungen für Felder innerhalb der Untertabelle weiter zu steuern, können Sie einzelnen Feldern Berechtigungen erteilen:

![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

### Als Block

- Die Sichtbarkeit eines Beziehungsblocks wird durch die Berechtigungen der Ziel-`Sammlung` des entsprechenden Beziehungsfeldes gesteuert und ist unabhängig von den Berechtigungen des Beziehungsfeldes.

Zum Beispiel wird die Anzeige des Beziehungsblocks „Kunde“ durch die Berechtigungen der `Sammlung` „Kunden“ gesteuert.

![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- Die Felder innerhalb eines Beziehungsblocks werden durch die Feldberechtigungen in der Ziel-`Sammlung` gesteuert.

Wie abgebildet können Sie Anzeigeberechtigungen für einzelne Felder in der `Sammlung` „Kunden“ festlegen.

![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)