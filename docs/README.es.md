# AI CLI Runner

Un plugin de [Obsidian](https://obsidian.md) que ejecuta herramientas AI CLI — Claude Code, aider y otras — en un panel de terminal directamente dentro de Obsidian.

> **Plataforma:** Solo macOS (Apple Silicon e Intel). El soporte para Windows/Linux está planificado.

**[English](../README.md) · [日本語](README.ja.md) · [中文](README.zh.md) · [Français](README.fr.md)**

---

## Características

- Panel de terminal integrado (xterm.js + node-pty) — sin necesidad de terminal externo
- Ejecuta Claude Code, aider, GitHub Copilot CLI o cualquier herramienta CLI personalizada
- Selector de herramientas + botones de inicio/detención en una barra de herramientas compacta
- Terminal dividida: abre múltiples paneles en paralelo
- Arrastra y suelta archivos del explorador de Obsidian al terminal para insertar su ruta
- Directorio de trabajo establecido automáticamente en la carpeta de la nota activa
- Soporte del protocolo de teclado Kitty (requerido para la TUI de Claude Code)
- Totalmente configurable: añade, edita o elimina herramientas en la Configuración

## Requisitos

- macOS (Apple Silicon o Intel)
- Las herramientas CLI que desees usar deben estar instaladas y disponibles en el PATH de tu shell (`.zshrc` / `.zprofile`)

## Instalación

### Instalación manual

1. Ve a la página de [Releases](https://github.com/KentaMaeda0916/obsidian-ai-cli-runner/releases) y descarga `obsidian-ai-cli-runner.zip`
2. Extrae el zip y mueve la carpeta `obsidian-ai-cli-runner` a `<vault>/.obsidian/plugins/`
3. Recarga Obsidian y habilita el plugin en **Configuración → Plugins de la comunidad**
4. Haz clic en ▶ para iniciar una herramienta — el binario nativo requerido se descarga automáticamente en el primer uso

> No se requieren pasos de firma de código ni eliminación de cuarentena.

## Uso

| Acción | Cómo |
|--------|------|
| Abrir panel de terminal | Clic en el ícono ✨ en la barra lateral izquierda, o paleta de comandos → **Open AI CLI panel** |
| Iniciar una herramienta | Selecciona del desplegable → clic en ▶ |
| Detener una herramienta en ejecución | Clic en ■ |
| Dividir terminal | Clic en el ícono de columnas divididas |
| Cerrar panel | Clic en el ícono de papelera |
| Insertar una ruta de archivo | Arrastra un archivo desde el explorador al terminal |

## Configuración

Ve a **Configuración → AI CLI Runner** para:

- Establecer la herramienta predeterminada que se abre al crear un nuevo panel
- Añadir herramientas personalizadas (cualquier comando CLI con argumentos opcionales)
- Editar o eliminar herramientas existentes

### Ejemplo: añadir una herramienta personalizada

| Campo | Valor |
|-------|-------|
| Nombre para mostrar | `My Tool` |
| Comando | `mytool` |
| Argumentos | `--flag value` |

## Cómo funciona

El plugin integra un PTY (pseudo-terminal) mediante `node-pty` y lo renderiza con `xterm.js`. Cada herramienta se lanza a través de tu shell de inicio de sesión (`$SHELL -i -l -c <command>`), por lo que tu configuración de shell (PATH, alias, etc.) está completamente disponible.

En el primer inicio, se descarga un pequeño binario nativo (`pty.node`) desde las GitHub Releases del plugin. Esto evita los problemas de macOS Gatekeeper que surgen con los binarios pre-firmados incluidos, y la descarga solo ocurre una vez.

## Solución de problemas

**"Failed to download pty binary" en el primer inicio**
- Comprueba tu conexión a internet
- El plugin descarga un pequeño binario nativo desde GitHub en el primer inicio — esto solo ocurre una vez

**"Failed to start \<command\>"**
- Asegúrate de que el comando está instalado: ejecuta `which <command>` en Terminal
- Verifica que está en tu PATH comprobando `.zshrc` o `.zprofile`

**Shift+Enter no funciona**
- El plugin envía la secuencia de escape del protocolo de teclado Kitty para Shift+Enter. Asegúrate de estar ejecutando una versión compatible de la herramienta CLI.

## Licencia

MIT — ver [LICENSE](../LICENSE)
