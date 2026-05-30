# AgenKan

AgenKan es una aplicación de escritorio diseñada para transformar tus notas de texto libre en planes estructurados y procesables dentro de **Vikunja**, utilizando la potencia de la Inteligencia Artificial a través de **Ollama** en modo local.

## Características Principales

- **Gestión de Notas Locales**: Escribe tus ideas sin estructura, la aplicación guarda todo localmente mediante SQLite.
- **Planificador Inteligente**: Utiliza LLMs locales (a través de Ollama) para analizar tus notas y deducir tareas, subtareas, etiquetas y descripciones.
- **Tres Modos de Acción**:
  - 📂 **Crear proyecto nuevo**: La IA infiere un nombre de proyecto y las tareas relacionadas.
  - 🔗 **Usar proyecto existente**: La IA asigna tareas a un proyecto que ya tengas en Vikunja.
  - ⚙️ **Management**: La IA puede crear o administrar componentes globales, como "Etiquetas" (Labels), si mencionas que necesitas categorizar algo.
- **Historial de Logs (Auditoría)**: Revisa exactamente qué prompt crudo (raw response) devolvió Ollama, y qué acciones se intentaron lanzar sobre el API de Vikunja. Excelente para debug y análisis del comportamiento de tu modelo.
- **Múltiples Tokens de Seguridad**: Posibilidad de configurar tokens base y tokens granulares para operaciones específicas (Creación, Modificación, Management) de cara a proteger tu instancia de Vikunja.

## Requisitos

- [Node.js](https://nodejs.org/) v22 o superior
- [pnpm](https://pnpm.io/) v11 o superior
- Una instancia de [Ollama](https://ollama.com/) corriendo localmente o en tu red (por defecto en `http://localhost:11434`) con al menos un modelo descargado (ej. `llama3`, `mistral`, `phi3`).
- Una instancia de [Vikunja](https://vikunja.io/) y un token de API válido.

## Instalación

1. Clona este repositorio:
   ```bash
   git clone <repo-url> agenkan
   cd agenkan
   ```

2. Instala las dependencias (se recomienda usar `mise` para la versión de Node y pnpm):
   ```bash
   pnpm install
   ```

3. (Opcional) Si la dependencia de base de datos no compila, el proyecto cuenta con un script de limpieza y reinstalación profunda:
   ```bash
   pnpm reinstall:full
   ```

## Ejecución

### Entorno de Desarrollo

Para arrancar la aplicación en modo desarrollo (con recarga en caliente para el renderer y el backend IPC):

```bash
pnpm dev
```

### Compilar para Producción

Para generar los empaquetables listos para distribuir (AppImage, deb, snap, etc. según tu SO):

```bash
pnpm build
```

## Configuración Inicial

1. Al abrir **AgenKan**, pulsa en el botón de configuración (el icono ⚙️ en la esquina superior derecha).
2. En la sección **Vikunja**, ingresa la URL de tu API (por ejemplo `http://localhost:3456/api/v1`) y tu Token de API principal.
   * *Opcional*: Rellena los Tokens específicos si tu cuenta de Vikunja tiene permisos separados por acción.
3. En la sección **Ollama**, ingresa la URL y despliega la lista para seleccionar el modelo que deseas que analice tus notas.
4. ¡Guarda los cambios y comienza a escribir!


-----------------------------------------------------
AgenKan © 2026 Luis Ballester Zafra. All rights reserved.

This repository and all associated source code, documentation, UI design, product naming, branding, and assets are proprietary.

No license is granted, express or implied, to copy, modify, distribute, sublicense, sell, or create derivative works from this software or any part of it without prior written permission from the copyright holder.

AgenKan name, logo, and branding are reserved for exclusive use by the project owner. Unauthorized use of the name or branding is prohibited.

For licensing inquiries, contact the project owner.