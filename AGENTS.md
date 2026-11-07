# AGENTS.md — Contexto y Guías para GitHub Copilot

Este documento define la visión, arquitectura, convenciones y limitaciones del proyecto **Pausa**. Debe ser consultado por cualquier agente de IA o desarrollador antes de proponer o escribir código.

## 1. Descripción Lógica y Propósito
**Pausa** es una aplicación móvil personal de bienestar emocional y registro diario (journaling). 
* **Objetivo:** Permitir al usuario registrar sus emociones, nivel de intensidad, contexto y etiquetas (tags) para seguimiento personal y análisis en terapia.
* **Filosofía:** Privacidad total, cero publicidad, costo cero de infraestructura y diseño intuitivo centrado en la salud mental.

## 2. Alcance y Limitaciones (Target & Scope)
* **Target:** Aplicación diseñada con un usuario objetivo único en mente (Single-User App) en Android, nada de iOS
* **Alcance:** Proyecto personal local. **NO** busca ser una aplicación multi-inquilino (multi-tenant), ni requiere arquitectura para millones de usuarios, ni servidores backend propios.

## 3. Stack Técnico y Arquitectura

* **Framework:** React Native con Expo (Managed Workflow).
* **Navegación:** React Navigation (`@react-navigation/native-stack`).
* **Base de Datos:** SQLite local mediante `expo-sqlite`.
* **Estilos:** `StyleSheet` nativo de React Native (sin Tailwind/NativeWind), consumiendo un tema centralizado de colores (`src/constants/Colors.js`).
* **PDF / Exportación:** `expo-print` y `expo-sharing` (generación mediante plantillas HTML/CSS en línea).
* **Estructura del Proyecto:**
  ```text
  src/
  ├── components/     # Componentes visuales reusables (e.g. SafeAreaWrapper)
  ├── constants/      # Constantes globales (Colors.js, etc.)
  ├── db/             # Métodos y consultas SQL con expo-sqlite (database.js)
  ├── navigation/     # Configuración de React Navigation (AppNavigator.js)
  ├── screens/        # Pantallas de la aplicación
  └── utils/          # Helpers y utilidades generales

## 4. Convenciones de código y reglas de desarrollo
Al generar o refactorizar código, el agente debe seguir estrictamente estas reglas:
1. Mentalidad Senior Pragmático:
    - No trabajes de más ni asumas requerimientos no solicitados
    - Aplica ael principio de mínima intervención: cambia únicamente lo necesario para solucionar el problema
    - Si un código existente funciona y no está relacionado con la tarea, no lo modifiques ni lo refactorices por gusto
3. Componentes visuales:
    - Toda pantalla nueva o modificada debe envolverse en el componente reusable SafeAreaWrapper
    - Los colores deben provenir de src/constants/Colors.js. No hardcodear valores hexadecimales a menos que sea necesario para opacidades específicas (Colors.primary + '15')
4. Manejo de errores y tipos:
    - Toda operación de base de datos (SQLite) o llamadas a APIs del dispositivo (expo-print, expo-sharing, expo-notifications) debe estar protegida con bloques try/catch y mensajes claros mediante Alert.alert
5. Base de datos:
    - Las consultas SQL deben mantenerse centralizadas en src/db/database.js. No escribir SQL directo en los componentes de React.
6. Simplicidad sobre Abstracción
    - Evitar librerías externas innecesarias si Expo o React Native ya proveen la solución de forma nativa.
    - Mantener el estado local con useState / useContext si es necesario; no meter Redux/Zustand a menos que sea explícitamente solicitado.
7. Testeos:
    - No necesitas crear tests automáticos ni ejecutar comandos como expo-doctor en cada iteración. Yo seré el tester, y con el puro comando de compilación es más que suficiente

## Y LO MÁS IMPORTANTE
Pregunta antes de asumir!! soy un programador junior, puede que se me pasen algunos conceptos, puede que algunos los dé por sentado, tu no asumas nada que no te diga explicitamente, si no te queda claro, preguntame antes de asumir y actuar