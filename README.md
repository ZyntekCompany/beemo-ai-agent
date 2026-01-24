<div align="center">

![Beemo AI Logo](apps/widget/public/icons/agent-logo.svg)

# Beemo AI

**Plataforma de soporte al cliente con IA**

Monorepo Turborepo + pnpm para una plataforma de soporte al cliente con un asistente IA (Beemo), panel de operaciones y widget embebible.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.4.1-blue.svg)](https://pnpm.io/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## 📋 Tabla de Contenidos

- [Arquitectura](#-arquitectura)
- [Tecnologías Clave](#-tecnologías-clave)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Variables de Entorno](#-variables-de-entorno)
  - [App Web](#app-web)
  - [App Widget](#app-widget)
  - [Backend (Convex)](#backend-convex)
- [Ejecutar el Proyecto](#-ejecutar-el-proyecto)
- [Scripts Disponibles](#-scripts-disponibles)
- [Funcionalidades Destacadas](#-funcionalidades-destacadas)
- [Despliegue](#-despliegue)

---

## 🏗️ Arquitectura

El proyecto está organizado como un monorepo con las siguientes aplicaciones y paquetes:

- **`apps/web`**: Panel principal (Next.js 16, App Router) con vistas de conversaciones, base de conocimiento, billing e integraciones. Puerto `3000` en desarrollo.
- **`apps/widget`**: Widget de atención embebible (Next.js 16) que crea sesiones de contacto y abre conversaciones con Beemo. Puerto `3001` en desarrollo.
- **`packages/backend`**: Funciones Convex (data, RAG, agentes, storage). Incluye agente de soporte, herramientas de búsqueda y escalado.
- **`packages/ui`**: Sistema de diseño compartido (shadcn/ui, Radix, TailwindCSS 4).
- **`packages/eslint-config`**, **`packages/typescript-config`**: Configuraciones compartidas.

---

## 🛠️ Tecnologías Clave

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Backend**: Convex (BD, auth server-side y storage) + `@convex-dev/rag` (embeddings OpenAI) + `@convex-dev/agent`
- **Autenticación**: Clerk (usuarios y organizaciones)
- **UI**: shadcn/ui + Radix + TailwindCSS + lucide-react
- **Build**: Turborepo + pnpm + eslint + prettier
- **Integraciones**: Vapi (voz, opcional)

---

## ✅ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 20 o superior
- **pnpm** 10 (el repo fija `packageManager: pnpm@10.4.1`)
- **CLI de Convex** (`pnpm dlx convex@latest`) para desarrollo/despliegue del backend
- **Proyecto en Clerk** y clave de OpenAI para las funciones de IA
- **(Opcional)** Credenciales de AWS para acceder a AWS Secrets Manager (necesario para integración con Vapi)

---

## 🚀 Instalación

1. **Clona el repositorio**

```bash
git clone <url-del-repositorio>
cd vera-ai
```

2. **Instala las dependencias**

```bash
pnpm install
```

3. **Configura las variables de entorno**

Crea los archivos `.env.local` en cada aplicación según la sección [Variables de Entorno](#-variables-de-entorno).

---

## 🔐 Variables de Entorno

Cada aplicación requiere su propio archivo `.env.local`. A continuación se detallan las variables necesarias para cada una:

### App Web

Crea el archivo `apps/web/.env.local`:

```bash
# Convex - URL del backend (obligatorio)
NEXT_PUBLIC_CONVEX_URL=http://localhost:3030

# Clerk - Autenticación (obligatorio)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_JWT_ISSUER_DOMAIN=https://<subdominio>.clerk.accounts.dev

# OpenAI - Para funciones de IA (obligatorio)
OPENAI_API_KEY=sk-openai-xxx
```

> **Nota**: `NEXT_PUBLIC_CONVEX_URL` es obligatorio. Para desarrollo local con Convex, el puerto por defecto es `3030`. En producción, usa la URL de tu deployment de Convex.

### App Widget

Crea el archivo `apps/widget/.env.local`:

```bash
# Convex - URL del backend (obligatorio)
NEXT_PUBLIC_CONVEX_URL=http://localhost:3030
```

> **Nota**: Las credenciales de Vapi se obtienen dinámicamente desde AWS Secrets Manager a través del backend. No es necesario configurar variables de Vapi en el widget.

### Backend (Convex)

Crea el archivo `packages/backend/convex/.env.local`:

```bash
# Clerk - Autenticación (obligatorio)
CLERK_SECRET_KEY=sk_test_xxx
CLERK_JWT_ISSUER_DOMAIN=https://<subdominio>.clerk.accounts.dev

# OpenAI - Para RAG y agentes de IA (obligatorio)
OPENAI_API_KEY=sk-openai-xxx

# Convex - Deployment (opcional, solo para producción)
CONVEX_DEPLOYMENT=<deployment-id>

# AWS Secrets Manager - Para integración con Vapi (opcional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu-access-key-id
AWS_SECRET_ACCESS_KEY=tu-secret-access-key
```

> **Nota**: El CLI de Convex lee las variables de entorno desde `packages/backend/convex/.env.local`. Para producción, configura `CONVEX_DEPLOYMENT` apuntando a tu proyecto en Convex Cloud.
>
> **Importante sobre Vapi**: Las credenciales de Vapi (claves pública y secreta) se almacenan y recuperan desde **AWS Secrets Manager**. El backend utiliza las credenciales de AWS (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) para acceder a Secrets Manager y obtener las credenciales de Vapi de forma segura. Las credenciales de Vapi se almacenan por organización en Secrets Manager con el formato `tenant/{organizationId}/vapi`.

---

## ▶️ Ejecutar el Proyecto

### Desarrollo con Turborepo (Recomendado)

Para ejecutar todas las aplicaciones en simultáneo:

```bash
pnpm dev
```

Este comando iniciará:
- **Backend Convex** en `http://localhost:3030`
- **App Web** en `http://localhost:3000`
- **App Widget** en `http://localhost:3001`

### Ejecutar aplicaciones individuales

Si prefieres ejecutar cada aplicación por separado:

```bash
# Backend Convex
pnpm --filter @workspace/backend dev

# App Web (en otra terminal)
pnpm --filter web dev

# App Widget (en otra terminal)
pnpm --filter widget dev
```

### Acceso a las aplicaciones

Una vez iniciadas las aplicaciones:

- **Panel Web**: Abre `http://localhost:3000` en tu navegador
- **Widget**: Abre `http://localhost:3001?organizationId=<orgId>` (reemplaza `<orgId>` con el ID de tu organización en Clerk)

> **Importante**: Asegúrate de iniciar sesión con Clerk, crear/seleccionar una organización y comenzar a probar conversaciones y la base de conocimiento.

---

## 📜 Scripts Disponibles

En la raíz del proyecto:

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Modo desarrollo con Turborepo (ejecuta todas las apps en simultáneo) |
| `pnpm build` | Build de todos los paquetes/apps |
| `pnpm lint` | Ejecuta lint sobre el monorepo |
| `pnpm format` | Formatea código con Prettier (`ts/tsx/md`) |

### Scripts por aplicación

```bash
# Type checking
pnpm --filter web typecheck
pnpm --filter widget typecheck

# Servidor Convex local
pnpm --filter @workspace/backend dev
```

---

## ✨ Funcionalidades Destacadas

- **🤖 Asistente IA multilenguaje**: Beemo opera con instrucciones en español, busca primero en la base de conocimiento y puede escalar/resolver conversaciones desde Convex.

- **💬 Gestión de conversaciones**: Estados `unresolved → escalated → resolved`, realce automático de respuestas del operador y scroll infinito de hilos.

- **📚 Base de conocimiento con RAG**: Subida, parsing y eliminación de documentos, almacenados en Convex Storage y embebidos con OpenAI para búsqueda semántica.

- **🎨 Widget embebible**: Flujo de autenticación ligera (nombre/email), creación de sesión de contacto con metadatos del navegador y transición a chat/inbox; listo para añadir voz vía Vapi.

- **🎯 UI compartida**: Componentes shadcn/ui centralizados en `packages/ui` (botones, inputs, AI chat UI, etc.), listos para reutilizar en apps y widget.

---

## 🚢 Despliegue

### Next.js Apps

```bash
# Build de producción
pnpm --filter web build
pnpm --filter widget build
```

Configura las mismas variables de entorno en tu hosting (Vercel, Netlify, etc.).

### Convex Backend

Desde `packages/backend/convex`:

```bash
pnpm dlx convex deploy
```

O usando npx:

```bash
npx convex deploy
```

Asegúrate de configurar `CONVEX_DEPLOYMENT` en tu `.env.local` apuntando al proyecto en Convex Cloud.

---

## 📝 Notas de Desarrollo

- El repositorio asume organizaciones de Clerk: el middleware redirige a selección de organización si falta.
- Si añades nuevas fuentes de datos para la base de conocimiento, revisa `packages/backend/convex/system/ai/rag.ts` para alinear modelo/dimensión de embeddings.
- Las credenciales de Vapi se gestionan a través de AWS Secrets Manager. El backend recupera las credenciales dinámicamente desde Secrets Manager cuando se solicitan. Asegúrate de configurar las credenciales de AWS correctamente para que el sistema pueda acceder a Secrets Manager.

---

<div align="center">

**Desarrollado con ❤️ usando Next.js, Convex y Clerk**

</div>
