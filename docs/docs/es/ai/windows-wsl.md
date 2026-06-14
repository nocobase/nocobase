---
title: Configurar un entorno de desarrollo local en Windows con WSL
description: Prepara Ubuntu, Docker Desktop, Node.js, Yarn y Codex CLI con WSL 2 en Windows para desarrollo local de NocoBase y flujos con AI Agent.
---

# Configurar un entorno de desarrollo local en Windows con WSL

Para el desarrollo local de NocoBase en Windows, recomendamos preparar primero WSL 2. Así Node.js, Yarn, NocoBase CLI, los comandos Docker y los AI Agents se ejecutan en la misma shell Linux, con rutas, permisos y compilación de dependencias nativas más cercanos a entornos Linux habituales.

Si no tienes claro si necesitas WSL, consulta primero [Configuración de desarrollo local](./local-development-setup.md).

## Antes de empezar

Antes de instalar WSL, comprueba la versión de Windows y el estado de virtualización.

### Comprobar la versión de Windows

Pulsa `Win + R`, escribe `winver` y confirma que el sistema cumple uno de estos requisitos:

- Windows 11
- Windows 10 version 2004 or later, Build 19041 or later

Si la versión es anterior, actualiza Windows antes de continuar.

### Comprobar la virtualización

Abre el Administrador de tareas, ve a Rendimiento / CPU y confirma que Virtualización aparece como Habilitada.

Si no está habilitada, actívala en BIOS / UEFI. El nombre puede variar: Intel VT-x, Intel Virtualization Technology, AMD-V o SVM Mode.

## Paso 1: instalar WSL 2

Abre PowerShell como administrador:

1. Abre el menú Inicio de Windows
2. `PowerShell`
3. Haz clic derecho y elige Ejecutar como administrador

Ejecuta:

```powershell
wsl --install
```

Reinicia el equipo después de la instalación.

Por defecto, este comando instala Ubuntu. En el primer inicio, Ubuntu pedirá crear un usuario y contraseña de Linux. Solo se usan dentro de WSL.

Para instalar una distribución específica, lista primero las disponibles:

```powershell
wsl --list --online
```

Después instala una distribución, por ejemplo Ubuntu:

```powershell
wsl --install -d Ubuntu
```

## Paso 2: confirmar la versión de WSL

Ejecuta en PowerShell:

```powershell
wsl --list --verbose
```

La salida debería parecerse a esto:

```text
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

Confirma que `VERSION` sea `2`. Si alguna distribución usa WSL 1, conviértela a WSL 2:

```powershell
wsl --set-version Ubuntu 2
```

También recomendamos dejar WSL 2 como versión predeterminada:

```powershell
wsl --set-default-version 2
```

También puedes actualizar WSL:

```powershell
wsl --update
```

## Paso 3: instalar Docker Desktop

Si planeas instalar o ejecutar NocoBase con Docker, instala Docker Desktop for Windows.

- [Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

Durante la instalación, presta atención a estas opciones:

1. Normalmente `Per-user` es suficiente para desarrollo local personal
2. `Use WSL 2 instead of Hyper-V`
3. Después de instalar, inicia Docker Desktop desde el menú Inicio
4. En el primer inicio, lee y acepta el Docker Desktop Subscription Service Agreement

## Paso 4: habilitar la integración WSL de Docker

Después de iniciar Docker Desktop, confirma primero que el backend WSL 2 está habilitado:

1. Docker Desktop / Settings / General
2. Use the WSL 2 based engine
3. Apply

![Docker Desktop WSL 2 engine](https://static-docs.nocobase.com/2026-06-12-19-10-41.png)

Luego habilita la integración de la distribución:

1. Docker Desktop / Settings / Resources / WSL Integration
2. Enable integration with my default WSL distro
3. Ubuntu
4. Apply & restart / Apply

![Docker Desktop WSL integration](https://static-docs.nocobase.com/2026-06-12-19-11-09.png)

Si WSL Integration no aparece en Resources, normalmente Docker Desktop está en modo Windows containers. Cambia a Linux containers desde el icono de Docker en la bandeja del sistema y vuelve a comprobar.

## Paso 5: verificar Docker

Primero verifica desde PowerShell:

```powershell
wsl --list --verbose
docker version
docker compose version
docker run hello-world
```

Después entra en WSL:

```powershell
wsl
```

Ejecuta dentro de WSL:

```bash
docker version
docker compose version
docker run hello-world
```

Si el contenedor `hello-world` se descarga y ejecuta correctamente, la integración entre Docker Desktop y WSL 2 funciona.

## Paso 6: instalar Node.js y Yarn en WSL

WSL no es un entorno de ejecución de Node.js. Ubuntu instalado con `wsl --install` normalmente no incluye Node.js ni npm, así que instálalos dentro de la distribución WSL.

```powershell
wsl
```

Todos los comandos siguientes se ejecutan en la terminal WSL. Primero comprueba si Node.js ya está instalado:

```bash
node -v
npm -v
```

Si aparece `command not found`, instala Node.js con uno de estos métodos.

### Opción A: instalar Node.js 22 con NodeSource

Si este entorno WSL solo necesita una versión compartida de Node.js, se recomienda NodeSource.

```bash
sudo apt update
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
sudo apt install -y nodejs
```

Verifica la instalación:

```bash
node -v
npm -v
npx -v
```

### Opción B: instalar Node.js 22 con nvm

Si necesitas cambiar versiones entre proyectos o un proyecto usa `.nvmrc`, usa nvm.

```bash
sudo apt update
sudo apt install -y curl ca-certificates
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

Si el proyecto debe fijar Node.js 22, crea `.nvmrc`:

```bash
echo "22" > .nvmrc
nvm install
nvm use
```

:::warning Nota

Elige NodeSource o nvm. No se recomienda mezclar ambos métodos de gestión de Node.js en el mismo usuario WSL.

:::

### Instalar Yarn 1.x

El desarrollo local de NocoBase requiere Yarn 1.x. Después de instalar Node.js, puedes habilitar Yarn con Corepack:

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn -v
```

Si Corepack no está disponible, instala Yarn con npm:

```bash
npm install -g yarn@1.22.22
yarn -v
```

## Paso 7: instalar Codex CLI

Codex CLI también puede usarse en la línea de comandos nativa de Windows. Aquí se instala dentro de WSL para que Codex y la toolchain local de NocoBase permanezcan en el mismo entorno Linux.

```bash
echo $WSL_DISTRO_NAME
```

Ejecuta el instalador de Codex CLI dentro de WSL:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Para instalación no interactiva:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 sh
```

Después de instalar, ejecuta y verifica la versión:

```bash
codex
codex --version
```

Recomendamos iniciar Codex desde un directorio de proyecto dentro de WSL:

```bash
mkdir -p ~/projects
cd ~/projects/my-app
codex
```

:::tip Nota

Como Codex está instalado dentro de WSL, ejecuta después `codex` desde la terminal WSL. PowerShell usa el entorno nativo de Windows, no el entorno WSL preparado aquí.

:::

## Dónde colocar los archivos del proyecto

Recomendamos colocar los proyectos dentro del sistema de archivos de WSL, por ejemplo:

```bash
~/projects/my-app
```

Evita usar la ruta montada de Windows como ubicación predeterminada:

```bash
/mnt/c/Users/<your-name>/projects/my-app
```

Normalmente ofrece mejor rendimiento de archivos y reduce problemas de symlinks y permisos.

Para abrir archivos WSL desde el Explorador de Windows, usa:

```text
\\wsl$\Ubuntu\home\<your-name>
```

## Preguntas frecuentes

### WSL indica que no encuentra el comando docker

Primero confirma que la distribución usa WSL 2:

```powershell
wsl --list --verbose
wsl --set-version Ubuntu 2
```

Luego vuelve a Docker Desktop y habilita la integración de la distribución en Settings / Resources / WSL Integration.

### Falta WSL Integration

Normalmente Docker Desktop está en modo Windows containers. Cambia a Linux containers desde el icono de Docker y abre de nuevo la integración WSL.

### Docker Desktop no inicia o WSL parece anormal

Prueba primero apagar y actualizar WSL, y luego reinicia Docker Desktop:

```powershell
wsl --shutdown
wsl --update
```

### Docker Engine fue instalado manualmente en WSL

Docker recomienda desinstalar Docker Engine o Docker CLI instalados directamente dentro de WSL antes de instalar Docker Desktop, para evitar conflictos con la integración WSL.

### WSL indica que no encuentra el comando codex

Primero confirma que estás dentro de WSL, revisa `PATH` y ejecuta de nuevo el instalador si hace falta:

```bash
echo $WSL_DISTRO_NAME
which codex
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

## Referencias oficiales

- [Microsoft Learn: How to install Linux on Windows with WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Microsoft Learn: Install Node.js on Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl)
- [Docker Docs: Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Docker Docs: Docker Desktop WSL 2 backend on Windows](https://docs.docker.com/desktop/features/wsl/)
- [Docker Docs: Change your Docker Desktop settings](https://docs.docker.com/desktop/settings-and-maintenance/settings/)
- [OpenAI Developers: Codex CLI](https://developers.openai.com/codex/cli)
- [OpenAI Developers: Codex on Windows](https://developers.openai.com/codex/windows)
- [nvm: Node Version Manager](https://github.com/nvm-sh/nvm)
- [npm Docs: Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/)
