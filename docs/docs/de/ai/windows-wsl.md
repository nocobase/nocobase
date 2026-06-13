---
title: Lokale Entwicklungsumgebung unter Windows mit WSL einrichten
description: Bereite Ubuntu, Docker Desktop, Node.js, Yarn und Codex CLI mit WSL 2 unter Windows für lokale NocoBase-Entwicklung und AI-Agent-Workflows vor.
---

# Lokale Entwicklungsumgebung unter Windows mit WSL einrichten

Für lokale NocoBase-Entwicklung unter Windows empfehlen wir zuerst WSL 2. So laufen Node.js, Yarn, NocoBase CLI, Docker-Befehle und AI Agents in derselben Linux-Shell, mit Pfaden, Berechtigungen und nativen Builds näher an typischen Linux-Deployments.

Wenn du noch nicht sicher bist, ob du WSL brauchst, lies zuerst [Lokale Entwicklungsumgebung einrichten](./local-development-setup.md).

## Vorbereitung

Prüfe vor der Installation von WSL die Windows-Version und den Virtualisierungsstatus.

### Windows-Version prüfen

Drücke `Win + R`, gib `winver` ein und bestätige, dass dein System eine der folgenden Anforderungen erfüllt:

- Windows 11
- Windows 10 version 2004 or later, Build 19041 or later

Wenn die Version älter ist, aktualisiere Windows, bevor du fortfährst.

### Virtualisierung prüfen

Öffne den Task-Manager, gehe zu Leistung / CPU und bestätige, dass Virtualisierung als Aktiviert angezeigt wird.

Wenn Virtualisierung nicht aktiviert ist, aktiviere sie im BIOS / UEFI. Die Option heißt je nach Hersteller Intel VT-x, Intel Virtualization Technology, AMD-V oder SVM Mode.

## Schritt 1: WSL 2 installieren

Öffne PowerShell als Administrator:

1. Windows-Startmenü öffnen
2. `PowerShell`
3. Mit der rechten Maustaste Als Administrator ausführen wählen

Ausführen:

```powershell
wsl --install
```

Starte den Computer nach der Installation neu.

Standardmäßig installiert dieser Befehl Ubuntu. Beim ersten Start fordert Ubuntu dich auf, einen Linux-Benutzernamen und ein Passwort zu erstellen. Diese gelten nur innerhalb von WSL.

Wenn du eine bestimmte Distribution installieren möchtest, liste zuerst die verfügbaren Distributionen auf:

```powershell
wsl --list --online
```

Installiere dann eine Distribution, zum Beispiel Ubuntu:

```powershell
wsl --install -d Ubuntu
```

## Schritt 2: WSL-Version bestätigen

Führe in PowerShell aus:

```powershell
wsl --list --verbose
```

Die Ausgabe sollte ungefähr so aussehen:

```text
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

Bestätige, dass `VERSION` den Wert `2` hat. Wenn eine Distribution noch WSL 1 verwendet, konvertiere sie zu WSL 2:

```powershell
wsl --set-version Ubuntu 2
```

Setze WSL 2 außerdem als Standard für neu installierte Distributionen:

```powershell
wsl --set-default-version 2
```

Du kannst WSL auch einmal aktualisieren:

```powershell
wsl --update
```

## Schritt 3: Docker Desktop installieren

Wenn du NocoBase mit Docker installieren oder ausführen möchtest, installiere Docker Desktop for Windows.

- [Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

Achte bei der Installation auf diese Optionen:

1. Für persönliche lokale Entwicklung reicht normalerweise `Per-user`
2. `Use WSL 2 instead of Hyper-V`
3. Starte Docker Desktop nach der Installation über das Windows-Startmenü
4. Lies und akzeptiere beim ersten Start das Docker Desktop Subscription Service Agreement

## Schritt 4: Docker WSL Integration aktivieren

Nachdem Docker Desktop gestartet ist, prüfe zuerst, dass das WSL-2-Backend aktiviert ist:

1. Docker Desktop / Settings / General
2. Use the WSL 2 based engine
3. Apply

![Docker Desktop WSL 2 engine](https://static-docs.nocobase.com/2026-06-12-19-10-41.png)

Aktiviere danach die Integration für die Distribution:

1. Docker Desktop / Settings / Resources / WSL Integration
2. Enable integration with my default WSL distro
3. Ubuntu
4. Apply & restart / Apply

![Docker Desktop WSL integration](https://static-docs.nocobase.com/2026-06-12-19-11-09.png)

Wenn WSL Integration unter Resources nicht erscheint, läuft Docker Desktop meist im Windows-containers-Modus. Wechsle über das Docker-Symbol im Windows-Infobereich zu Linux containers und prüfe erneut.

## Schritt 5: Docker prüfen

Prüfe zuerst in PowerShell:

```powershell
wsl --list --verbose
docker version
docker compose version
docker run hello-world
```

Wechsle dann in WSL:

```powershell
wsl
```

Führe in WSL aus:

```bash
docker version
docker compose version
docker run hello-world
```

Wenn der `hello-world`-Container erfolgreich geladen und ausgeführt wird, funktioniert die Integration von Docker Desktop und WSL 2.

## Schritt 6: Node.js und Yarn in WSL installieren

WSL selbst ist keine Node.js-Laufzeitumgebung. Das mit `wsl --install` installierte Ubuntu enthält normalerweise kein Node.js und npm, daher installierst du sie innerhalb der WSL-Distribution.

```powershell
wsl
```

Alle folgenden Befehle werden im WSL-Terminal ausgeführt. Prüfe zuerst, ob Node.js bereits installiert ist:

```bash
node -v
npm -v
```

Wenn `command not found` erscheint, installiere Node.js mit einer der folgenden Methoden.

### Variante A: Node.js 22 mit NodeSource installieren

Wenn diese WSL-Umgebung nur eine gemeinsame Node.js-Version braucht, ist NodeSource empfehlenswert.

```bash
sudo apt update
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
sudo apt install -y nodejs
```

Installation prüfen:

```bash
node -v
npm -v
npx -v
```

### Variante B: Node.js 22 mit nvm installieren

Wenn du zwischen Projekten Node.js-Versionen wechseln musst oder ein Projekt `.nvmrc` nutzt, verwende nvm.

```bash
sudo apt update
sudo apt install -y curl ca-certificates
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

Wenn das Projekt Node.js 22 festlegen soll, erstelle `.nvmrc`:

```bash
echo "22" > .nvmrc
nvm install
nvm use
```

:::warning Hinweis

Wähle entweder NodeSource oder nvm. Es wird nicht empfohlen, beide Node.js-Verwaltungen im selben WSL-Benutzerkonto zu mischen.

:::

### Yarn 1.x installieren

Für lokale NocoBase-Entwicklung wird Yarn 1.x benötigt. Nach der Node.js-Installation kannst du Yarn über Corepack aktivieren:

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn -v
```

Wenn Corepack in deiner Umgebung nicht verfügbar ist, installiere Yarn mit npm:

```bash
npm install -g yarn@1.22.22
yarn -v
```

## Schritt 7: Codex CLI installieren

Codex CLI kann auch in der nativen Windows-Befehlszeile verwendet werden. In dieser Anleitung wird es in WSL installiert, damit Codex und die NocoBase-Toolchain in derselben Linux-Umgebung bleiben.

```bash
echo $WSL_DISTRO_NAME
```

Führe den Codex-CLI-Installer in WSL aus:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Für eine nicht-interaktive Installation:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 sh
```

Nach der Installation ausführen und Version prüfen:

```bash
codex
codex --version
```

Starte Codex am besten aus einem Projektverzeichnis innerhalb von WSL:

```bash
mkdir -p ~/projects
cd ~/projects/my-app
codex
```

:::tip Hinweis

Da Codex in WSL installiert ist, solltest du `codex` danach auch im WSL-Terminal ausführen. PowerShell verwendet die native Windows-Umgebung und nicht die in dieser Anleitung vorbereitete WSL-Umgebung.

:::

## Wo Projektdateien liegen sollten

Lege Projektdateien am besten im WSL-Dateisystem ab, zum Beispiel:

```bash
~/projects/my-app
```

Vermeide Windows-Mount-Pfade als Standard-Projektort, zum Beispiel:

```bash
/mnt/c/Users/<your-name>/projects/my-app
```

Das bringt meist bessere Dateisystemleistung und reduziert Probleme mit Symlinks und Berechtigungen.

Um WSL-Dateien im Windows Explorer zu öffnen, verwende:

```text
\\wsl$\Ubuntu\home\<your-name>
```

## FAQ

### WSL meldet, dass der docker-Befehl nicht gefunden wurde

Prüfe zuerst, ob die Distribution WSL 2 verwendet:

```powershell
wsl --list --verbose
wsl --set-version Ubuntu 2
```

Aktiviere danach in Docker Desktop unter Settings / Resources / WSL Integration die Integration für die entsprechende Distribution.

### WSL Integration fehlt

Meist befindet sich Docker Desktop im Windows-containers-Modus. Wechsle über das Docker-Symbol im Infobereich zu Linux containers und öffne die WSL-Integration erneut.

### Docker Desktop startet nicht oder WSL wirkt fehlerhaft

Versuche zuerst, WSL herunterzufahren und zu aktualisieren, und starte danach Docker Desktop neu:

```powershell
wsl --shutdown
wsl --update
```

### Docker Engine wurde manuell in WSL installiert

Docker empfiehlt, vor der Installation von Docker Desktop direkt in WSL installierte Docker Engine- oder Docker CLI-Pakete zu entfernen, um Konflikte mit der WSL-Integration zu vermeiden.

### WSL meldet, dass der codex-Befehl nicht gefunden wurde

Prüfe zuerst, ob du wirklich in WSL bist, prüfe danach `PATH` und führe den Installer bei Bedarf erneut aus:

```bash
echo $WSL_DISTRO_NAME
which codex
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

## Offizielle Referenzen

- [Microsoft Learn: How to install Linux on Windows with WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Microsoft Learn: Install Node.js on Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl)
- [Docker Docs: Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Docker Docs: Docker Desktop WSL 2 backend on Windows](https://docs.docker.com/desktop/features/wsl/)
- [Docker Docs: Change your Docker Desktop settings](https://docs.docker.com/desktop/settings-and-maintenance/settings/)
- [OpenAI Developers: Codex CLI](https://developers.openai.com/codex/cli)
- [OpenAI Developers: Codex on Windows](https://developers.openai.com/codex/windows)
- [nvm: Node Version Manager](https://github.com/nvm-sh/nvm)
- [npm Docs: Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/)
