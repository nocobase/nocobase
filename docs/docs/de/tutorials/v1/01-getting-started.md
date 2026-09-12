# Kapitel 1: Erste Schritte mit NocoBase

<iframe width="800" height="450" src="https://player.bilibili.com/player.html?isOutside=true&aid=113592322098790&bvid=BV18qzRYyErc&cid=27170310323&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

## 1.1 Schnell ausprobieren

Wir empfehlen Ihnen zuerst, NocoBase schnell auszuprobieren, um seine Leistungsfähigkeit kennenzulernen. Sie können in der [Online-Demo](https://demo-cn.nocobase.com/new) Ihre E-Mail-Adresse und einige Angaben hinterlegen und auf „Aktivieren“ klicken. Sie erhalten dann ein Testsystem für 2 Tage, das alle kommerziellen Plugins enthält:

![](https://static-docs.nocobase.com/Solution/202411052322391730820159.png)

![](https://static-docs.nocobase.com/Solution/202411052328231730820503.png)

Nachdem Sie die offizielle E-Mail von NocoBase erhalten haben, können Sie direkt loslegen und sich von der Flexibilität und Leistungsfähigkeit von NocoBase überzeugen. Sie können im Testsystem alles ausprobieren, ohne sich Gedanken machen zu müssen.

## 1.2 Die Grundoberfläche von NocoBase

Willkommen bei NocoBase! Bei der ersten Nutzung kann die Oberfläche etwas ungewohnt wirken und es ist nicht immer klar, wo man anfangen soll. Keine Sorge – wir machen Sie Schritt für Schritt mit den wichtigsten Funktionsbereichen vertraut, damit Sie zügig einsteigen können.

### 1.2.1 **UI-Konfiguration**

Beim ersten Aufruf von NocoBase sehen Sie eine schlichte und übersichtliche Hauptoberfläche. In der oberen rechten Ecke befindet sich die Schaltfläche [**UI-Konfiguration**](https://docs-cn.nocobase.com/handbook/ui/ui-editor). Klicken Sie darauf, wechselt das System in den UI-Konfigurationsmodus. Das ist Ihr Hauptarbeitsbereich, um Systemseiten zu erstellen.

![UI-Konfigurationsmodus](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152031029.png)

**Vorgehensweise:**

1. **In den Konfigurationsmodus wechseln**: Klicken Sie oben rechts auf die Schaltfläche „UI-Konfiguration“, um in den Konfigurationsmodus zu gelangen.
2. **[Menü](https://docs-cn.nocobase.com/handbook/ui/menus)-Seite hinzufügen**:
   - Klicken Sie auf „Menüpunkt hinzufügen“.
   - Geben Sie einen Menünamen ein (z. B. „Testseite“) und bestätigen Sie.
   - Das System legt die neue Testseite automatisch an und springt direkt dorthin.

![demov4-001.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152032346.gif)

3. **[Block](https://docs-cn.nocobase.com/handbook/ui/blocks) erstellen**:
   - Klicken Sie auf der Testseite auf die Schaltfläche „Block erstellen“.
   - Wählen Sie aus den Blocktypen einen Datenblock, etwa einen „Tabellen-Block“.
   - Verbinden Sie ihn mit einer Datentabelle, beispielsweise der systemeigenen Tabelle „Benutzer“.
   - Wählen Sie die anzuzeigenden Felder und bestätigen Sie.
4. Schon ist ein Tabellen-Block fertig, der die Benutzerliste anzeigt!

![Block erstellen](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152032964.gif)

Ganz einfach, oder? Das Block-Konzept von NocoBase ist von Notion inspiriert, aber deutlich leistungsfähiger und ermöglicht den Aufbau komplexerer Systeme. In den folgenden Tutorials gehen wir auf die verschiedenen Blocktypen genauer ein – freuen Sie sich darauf!

### 1.2.2 **Plugin-Manager**

Plugins sind das wichtigste Werkzeug, um die Funktionalität von NocoBase zu erweitern. Im [**Plugin-Manager**](https://docs-cn.nocobase.com/handbook/plugin-manager) können Sie Plugins anzeigen, installieren, aktivieren oder deaktivieren – passend zu unterschiedlichen Geschäftsanforderungen.

Mit Plugin-Erweiterungen lassen sich praktische oder überraschende Funktionsintegrationen umsetzen, die Ihre Gestaltung und Entwicklung deutlich erleichtern.

![Plugin-Manager](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152034703.png)

**Vorgehensweise:**

1. **Installierte Plugins ansehen**: Klicken Sie auf „Plugin-Manager“ und Sie sehen die Liste aller aktuell installierten Plugins.
2. **Plugin aktivieren**:
   - Suchen Sie das gewünschte Plugin, etwa das Plugin „Theme Editor“.
   - Klicken Sie auf „Aktivieren“, um das Plugin einzuschalten.
3. **Plugin-Funktion testen**:
   - Nach Aktivierung des „Theme Editor“ können Sie über das persönliche Center oben rechts schnell das System-Theme ändern.
     ![System-Theme ändern](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152035380.gif)
   - Im Einstellungsbereich finden Sie die Theme-Editor-Oberfläche, in der Sie das System-Theme individuell anpassen können – etwa Farben, Schriftarten usw.
     ![Theme-Editor-Oberfläche](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152035889.png)

### 1.2.3 **Einstellungsseite**

Die **Einstellungsseite** bündelt die System- und Plugin-Einstellungen und hilft Ihnen dabei, alle Aspekte von NocoBase zentral zu verwalten.

![Einstellungsseite](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036847.png)

**Einige häufig verwendete Plugin-Einstellungen, zum Beispiel:**

- [**Datenquellenverwaltung**](https://docs-cn.nocobase.com/handbook/data-source-manager): Verwaltung aller Datentabellen und Konfiguration der Hauptdatenbank oder externer Datenbanken.
- [**Systemeinstellungen**](https://docs-cn.nocobase.com/handbook/system-settings): Anpassen von Systemname, Logo, Sprache und weiteren Grunddaten.
- [**Benutzer und Berechtigungen**](https://docs-cn.nocobase.com/handbook/users): Verwaltung von Benutzerkonten und Konfiguration der Berechtigungen verschiedener Rollen.
- [**Plugin-Einstellungen**](https://docs-cn.nocobase.com/handbook/plugin-manager): Detaillierte Konfiguration und Verwaltung der installierten Plugins.

### 1.2.4 **Versionsinformation und Support**

Oben rechts auf der Oberfläche sehen Sie die **Versionsinformation von NocoBase**. Sollten Sie bei der Nutzung Fragen haben, finden Sie über die **Startseite** und das **Benutzerhandbuch** Hilfe.

![Versionsinformation](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036065.png)

### 1.2.5 **Persönliches Center**

Das persönliche Center finden Sie oben rechts auf der Oberfläche. Hier können Sie **persönliche Daten ändern** und **Rollen wechseln** sowie weitere wichtige Systemfunktionen aufrufen.
Manche Plugins erweitern den Funktionsumfang dieses Bereichs zusätzlich.

![Persönliches Center](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036889.png)

## 1.3 NocoBase installieren

Wenn Sie sich entschieden haben, NocoBase intensiver zu nutzen, müssen wir es auf Ihrem Rechner oder Server installieren. NocoBase bietet verschiedene Installationsoptionen – wählen Sie die für Sie passende Methode und starten Sie mühelos in die No-Code-Entwicklung.

### 1.3.1 **Installationsmethoden**

1. **Docker-Installation (empfohlen)**

   - **Vorteile**: Schnell und einfach, ideal für Anwender, die mit Docker vertraut sind.
   - **Versionswahl**:
     - **main & latest**: Die zum aktuellen Zeitpunkt stabilste Version, geeignet für die meisten Anwender.
     - **next**: Beta-Version, ideal für Anwender, die neue Features ausprobieren möchten. Beachten Sie, dass diese Version möglicherweise noch nicht vollständig stabil ist – sichern Sie wichtige Daten vor der Nutzung.
   - **Vorgehensweise**:
     - Folgen Sie der [offiziellen Installationsanleitung](https://docs-cn.nocobase.com/welcome/getting-started/installation/docker-compose) und stellen Sie NocoBase mit Docker Compose Schritt für Schritt bereit.
2. **Create-NocoBase-App-Installation**

   - **Zielgruppe**: Frontend-Entwickler oder Anwender, die mit npm vertraut sind.
   - **Vorgehensweise**:
     - Folgen Sie der [Installationsanleitung](https://docs-cn.nocobase.com/welcome/getting-started/installation/create-nocobase-app) und installieren Sie über das npm-Paket.
3. **Quellcode-Installation**

   - **Zielgruppe**: Entwickler, die NocoBase tiefgreifend anpassen möchten.
   - **Vorgehensweise**:
     - Folgen Sie der [Installationsanleitung](https://docs-cn.nocobase.com/welcome/getting-started/installation/git-clone), klonen Sie den Quellcode von GitHub und installieren Sie entsprechend Ihren Anforderungen.

### 1.3.2 **Detaillierte Installationsanleitung (am Beispiel Docker)**

Unabhängig von der Installationsmethode finden Sie in der **NocoBase-Installationsdokumentation** ausführliche Schritte und Erläuterungen. Im Folgenden sehen Sie eine Kurzanleitung für die Docker-Installation, mit der Sie schnell loslegen:

1. **Docker installieren**: Stellen Sie sicher, dass Docker auf Ihrem System installiert ist. Falls nicht, können Sie es auf der [Docker-Website](https://www.docker.com/) herunterladen und installieren.
2. **Docker-Compose-Datei vorbereiten**:

   - Öffnen Sie ein Terminal oder eine Kommandozeile.
   - Erstellen Sie das Verzeichnis `nocobase` und legen Sie die Docker-Compose-Konfiguration an.

```bash
mkdir nocobase
cd nocobase
vim docker-compose.yml
```

3. Fügen Sie in `docker-compose.yml` die folgende Konfiguration ein, passen Sie sie nach Bedarf an und speichern Sie die Datei.

```bash
version: "3"

networks:
  nocobase:
        driver: bridge

services:
  app:
        image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
        networks:
          - nocobase
        depends_on:
          - postgres
        environment:
          # Geheimer Schlüssel der App, wird u. a. zum Generieren von Benutzer-Tokens verwendet
          # Wenn APP_KEY geändert wird, werden alte Tokens ungültig
          # Beliebige zufällige Zeichenfolge, die nicht nach außen gelangen darf
          - APP_KEY=your-secret-key
          # Datenbanktyp, unterstützt postgres, mysql, mariadb, sqlite
          - DB_DIALECT=postgres
          # Datenbank-Host, kann durch die IP eines vorhandenen Datenbankservers ersetzt werden
          - DB_HOST=postgres
          # Datenbankname
          - DB_DATABASE=nocobase
          # Datenbankbenutzer
          - DB_USER=nocobase
          # Datenbank-Passwort
          - DB_PASSWORD=nocobase
          # Zeitzone
          - TZ=Asia/Shanghai
        volumes:
          - ./storage:/app/nocobase/storage
        ports:
          - "13000:80"
        # init: true

  # Wenn Sie einen vorhandenen Datenbankdienst nutzen, können Sie postgres weglassen
  postgres:
        image: registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
        restart: always
        command: postgres -c wal_level=logical
        environment:
          POSTGRES_USER: nocobase
          POSTGRES_DB: nocobase
          POSTGRES_PASSWORD: nocobase
        volumes:
          - ./storage/db/postgres:/var/lib/postgresql/data
        networks:
          - nocobase
```

4. **NocoBase starten**:
   - Führen Sie im Verzeichnis `nocobase` den folgenden Befehl aus, um den Dienst zu starten:

```bash
docker-compose up -d
```

- Damit werden die erforderlichen Images heruntergeladen und der NocoBase-Dienst gestartet.

5. **NocoBase aufrufen**:
   - Öffnen Sie den Browser und rufen Sie `http://localhost:13000` auf (je nach Konfiguration kann sich die Adresse unterscheiden), um die Login-Seite von NocoBase zu sehen.

Nach diesen Schritten haben Sie NocoBase erfolgreich installiert und gestartet! Folgen Sie nun den Anleitungen in den Tutorials, um Ihr eigenes Anwendungssystem aufzubauen.

---

Mit den oben beschriebenen Schritten haben Sie hoffentlich einen guten Einstieg in die Grundoberfläche und den Installationsprozess von NocoBase gefunden. Im [nächsten Kapitel (Kapitel 2: Aufgabenverwaltungssystem entwerfen)](https://www.nocobase.com/cn/tutorials/task-tutorial-system-design) werden wir die leistungsfähigen Funktionen von NocoBase weiter erkunden und Sie beim Aufbau einer funktionsreichen Anwendung unterstützen. Lassen Sie uns gemeinsam den nächsten Schritt machen und in die Welt der No-Code-Entwicklung eintauchen!
