# AgenKan

Bloc de notas con tablero kanban integrado y planificador con IA local.
Escribe (o dicta) ideas en texto libre y la IA, vía **Ollama**, las convierte
en tarjetas accionables dentro de un kanban propio — sin servicios externos.

## Arquitectura

Monorepo **pnpm + Turborepo** con separación clara entre apps y paquetes:

```
agenkan/
├── apps/
│   ├── api/        # Servidor Fastify + SQLite (clean architecture)
│   │   └── src/
│   │       ├── domain/          # Entidades, puertos y servicios de negocio
│   │       ├── infrastructure/  # SQLite, cliente Ollama, prompts
│   │       └── presentation/    # Rutas HTTP, auth, manejo de errores
│   ├── web/        # Frontend React (notas + kanban + planner), responsive
│   │   └── src/
│   │       ├── modules/         # notes / kanban / planner / settings / connection
│   │       ├── composables/     # hooks reutilizables (voz, debounce)
│   │       └── lib/             # cliente API tipado
│   └── mobile/     # Wrapper Capacitor → APK Android
├── packages/
│   ├── shared/     # Schemas zod: el contrato único entre API y clientes
│   ├── ui/         # Componentes base + design tokens
│   └── config/     # tsconfig compartidos
└── .github/workflows/android-apk.yml   # Compila la APK en CI
```

El modelo de despliegue: el **servidor** (API + base de datos SQLite + web
compilada) corre en tu ordenador y publica un puerto. Cualquier cliente —
navegador del PC o APK del móvil — se conecta a ese endpoint con una
contraseña y trabaja sobre los mismos datos.

## Características

- **Bloc de notas** con autoguardado, búsqueda y estado (borrador/planificada).
- **Dictado por voz**: Web Speech API en navegador y reconocimiento nativo de
  Android en la APK.
- **Kanban propio**: tableros, columnas y tarjetas con drag & drop,
  etiquetas y prioridades. Sin dependencias de Vikunja ni terceros.
- **Planificador IA**: eliges el destino (tablero nuevo o existente), el
  modelo propone un plan con salida estructurada (JSON Schema + validación
  zod + reintento con feedback) y tú lo apruebas antes de aplicarlo.
- **Auditoría**: cada ejecución del planner queda registrada (modelo usado,
  respuesta cruda, resultado).
- **Una sola contraseña** protege toda la API (`API_PASSWORD`).

## Requisitos

- [Node.js](https://nodejs.org/) 22+ y [pnpm](https://pnpm.io/) 10+
- [Ollama](https://ollama.com/) accesible desde el servidor, con un modelo
  descargado (ej. `qwen3:8b`)

## Puesta en marcha

```bash
pnpm install
cp .env.example .env       # edita API_PASSWORD y la config de Ollama

# Desarrollo (API en :3210 + web con hot-reload en :5173)
pnpm dev

# Producción
pnpm build                 # compila shared, ui, web y api
pnpm start                 # sirve API + web en http://HOST:PORT
```

Para usarlo desde fuera de casa, publica el puerto del servidor (router o
túnel) y usa una contraseña fuerte. La APK y el navegador solo necesitan el
endpoint y esa contraseña.

## App Android

Ver [apps/mobile/README.md](apps/mobile/README.md). Resumen: ejecuta el
workflow **Android APK** en GitHub Actions y descarga el artefacto, o
compílala en local con Android Studio/Gradle. Al abrirla, introduce el
endpoint (`http://tu-ip:3210`) y la contraseña; queda configurada.

## Scripts útiles

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Levanta API y web en modo desarrollo |
| `pnpm build` | Build de producción de todo el monorepo |
| `pnpm start` | Arranca el servidor (sirve también la web) |
| `pnpm typecheck` | Comprueba tipos en todos los paquetes |
| `pnpm test` | Tests de integración de la API |
| `pnpm android:sync` | Sincroniza la web compilada con el proyecto Android |

-----------------------------------------------------
AgenKan © 2026 Luis Ballester Zafra. All rights reserved.

This repository and all associated source code, documentation, UI design, product naming, branding, and assets are proprietary.

No license is granted, express or implied, to copy, modify, distribute, sublicense, sell, or create derivative works from this software or any part of it without prior written permission from the copyright holder.

AgenKan name, logo, and branding are reserved for exclusive use by the project owner. Unauthorized use of the name or branding is prohibited.

For licensing inquiries, contact the project owner.
