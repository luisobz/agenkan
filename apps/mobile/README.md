# AgenKan Mobile (Android)

Wrapper [Capacitor](https://capacitorjs.com/) que empaqueta la web de AgenKan
como APK nativa. La app pide el endpoint de la API y la contraseña la primera
vez, lo guarda en el dispositivo y a partir de ahí funciona contra tu servidor.

El dictado por voz usa el plugin nativo
`@capacitor-community/speech-recognition` (el reconocimiento de voz de Android).

## Obtener la APK

### Opción A: GitHub Actions (sin instalar nada)

El workflow **Android APK** (`.github/workflows/android-apk.yml`) compila la
APK en CI. Lánzalo desde la pestaña _Actions_ del repositorio (botón
_Run workflow_) y descarga el artefacto `agenkan-debug-apk`.

### Opción B: compilar en local

Requisitos: JDK 21 y Android SDK (o Android Studio).

```bash
# Desde la raíz del repo
pnpm install
pnpm build                      # compila shared, ui y web

cd apps/mobile
pnpm cap add android            # solo la primera vez (genera ./android)
pnpm sync                       # copia la web compilada al proyecto Android
pnpm apk:debug                  # genera android/app/build/outputs/apk/debug/app-debug.apk
```

Para abrirlo en Android Studio: `pnpm open`.

> La carpeta `android/` es generada y está en `.gitignore`; no se versiona.
