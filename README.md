# Pausa

Pausa es una aplicación móvil de diario emocional para Android. Permite registrar emociones, intensidad, notas y etiquetas, consultar el historial y observar patrones personales a lo largo del tiempo.

El proyecto nació como una aplicación personal de bienestar emocional. Su prioridad es mantener los datos localmente, sin publicidad, sin cuentas de usuario y sin un backend propio.

## Características

- Registro de emociones con intensidad y notas.
- Calendario e historial de entradas.
- Etiquetas automáticas extraídas de las notas.
- Gestión de etiquetas y palabras bloqueadas.
- Dashboard con resúmenes, gráficos y métricas por período.
- Patrones emocionales por día de la semana.
- Recordatorio diario local para registrar una entrada.
- Exportación de reportes PDF.
- Respaldo completo en JSON.
- Importación de respaldos en una instalación nueva.
- Interfaz en español y tema oscuro.

## Privacidad Y Datos

Pausa utiliza SQLite local mediante `expo-sqlite`. Las entradas, notas, etiquetas y configuraciones se almacenan en el dispositivo.

La aplicación no incluye autenticación, sincronización en la nube, publicidad ni un servidor propio. El usuario es responsable de conservar sus respaldos JSON en un lugar seguro.

## Requisitos

- Node.js compatible con Expo SDK 58.
- Android Studio o Expo Go para desarrollo.
- Un dispositivo Android o un emulador Android.
- Una cuenta de Expo/EAS únicamente si se desean generar builds distribuidas.

Pausa está enfocada en Android. La compatibilidad con iOS no forma parte del alcance actual.

## Instalación

```bash
npm install
```

Inicia el proyecto con:

```bash
npx expo start
```

Desde la interfaz de Expo puedes abrir la aplicación en un dispositivo Android o en un emulador.

Para limpiar la caché de Metro:

```bash
npx expo start -c
```

## Desarrollo Android

Para crear una build de desarrollo con módulos nativos:

```bash
npx expo run:android
```

Las notificaciones locales requieren una build que incluya la configuración nativa de `expo-notifications`. Expo Go puede servir para otras partes del desarrollo, pero una development build es la opción recomendada para validar notificaciones.

## Builds Y Releases

El proyecto utiliza EAS Build. Los perfiles disponibles están definidos en `eas.json`.

Build interna instalable en Android:

```bash
eas build --platform android --profile preview
```

Build de desarrollo:

```bash
eas build --platform android --profile development
```

La build `preview` es adecuada para compartir un APK fuera de Google Play. La build `production` está pensada para distribución formal y utiliza incremento automático de versión.

## Respaldos

Desde Ajustes se puede crear un respaldo JSON con las entradas, etiquetas, etiquetas bloqueadas y configuración del recordatorio.

La importación reemplaza los datos actuales de la aplicación. Está pensada principalmente para restaurar el historial en una instalación nueva durante un cambio de teléfono.

Los identificadores internos de SQLite y los identificadores temporales de notificaciones no se reutilizan. La aplicación crea nuevos identificadores al importar.

El PDF es un reporte para lectura y no debe utilizarse como respaldo.

## Estructura

```text
src/
├── components/     Componentes visuales reutilizables
├── constants/      Colores y constantes globales
├── data/           Árbol de emociones
├── db/             Inicialización y consultas SQLite
├── navigation/     Navegación de la aplicación
├── screens/        Pantallas principales
└── utils/          Utilidades de emociones, etiquetas y respaldos
```

## Tecnologías

- React Native
- Expo SDK 58
- React Navigation
- SQLite mediante `expo-sqlite`
- `expo-notifications`
- `expo-file-system`
- `expo-print` y `expo-sharing`
- React Native StyleSheet

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE).
