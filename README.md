# Vera AI — Plataforma de soporte al cliente con IA

Monorepo Turborepo + pnpm para una plataforma de soporte al cliente con un asistente IA (Vera), panel de operaciones y widget embebible. Incluye un backend sobre Convex con RAG para la base de conocimiento y autenticación multi-organización con Clerk.

## Arquitectura
- `apps/web`: panel principal (Next.js 16, App Router) con vistas de conversaciones, base de conocimiento, billing e integraciones.
- `apps/widget`: widget de atención embebible (Next.js 16) que crea sesiones de contacto y abre conversaciones con Vera. Port 3001 en desarrollo.
- `packages/backend`: funciones Convex (data, RAG, agentes, storage). Incluye agente de soporte, herramientas de búsqueda y escalado.
- `packages/ui`: sistema de diseño compartido (shadcn/ui, Radix, TailwindCSS 4).
- `packages/eslint-config`, `packages/typescript-config`: configuraciones compartidas.

## Tecnologías clave
- Next.js 16 + React 19 + TypeScript.
- Convex (BD, auth server-side y storage) + @convex-dev/rag (embeddings OpenAI) + @convex-dev/agent.
- Clerk (usuarios y organizaciones).
- shadcn/ui + Radix + TailwindCSS + lucide-react.
- Turborepo + pnpm + eslint + prettier.
- Integración de voz vía Vapi (hook listo, requiere clave).

## Requisitos previos
- Node.js 20 o superior.
- pnpm 10 (el repo ya fija `packageManager: pnpm@10.4.1`).
- CLI de Convex (`pnpm dlx convex@latest`) para desarrollo/despliegue del backend.
- Proyecto en Clerk y clave de OpenAI para las funciones de IA.
- (Opcional) clave pública de Vapi para habilitar voz en el widget.

## Variables de entorno
Configura archivos `.env.local` en cada app y en `packages/backend/convex` (Convex CLI los lee allí). Ejemplos:

```
# apps/web/.env.local y apps/widget/.env.local
NEXT_PUBLIC_CONVEX_URL=http://localhost:3030
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_JWT_ISSUER_DOMAIN=https://<subdominio>.clerk.accounts.dev
OPENAI_API_KEY=sk-openai-xxx
```

```
# packages/backend/convex/.env.local
CLERK_SECRET_KEY=sk_test_xxx
CLERK_JWT_ISSUER_DOMAIN=https://<subdominio>.clerk.accounts.dev
OPENAI_API_KEY=sk-openai-xxx
# Opcional
CONVEX_DEPLOYMENT=<deployment-id>   # para apuntar a Convex cloud
VAPI_PUBLIC_KEY=<tu-clave>          # si usas voz en el widget
```

> Nota: `NEXT_PUBLIC_CONVEX_URL` es obligatorio en los clientes (proveedor Convex). Para Convex en local, el puerto por defecto es `3030`.

## Puesta en marcha rápida
1. Instala dependencias en la raíz: `pnpm install`.
2. Arranca Convex (ventana 1): `pnpm --filter @workspace/backend dev`.
3. Arranca el panel web (ventana 2): `pnpm --filter web dev` (http://localhost:3000).
4. Arranca el widget (ventana 3, opcional): `pnpm --filter widget dev` (http://localhost:3001?organizationId=<orgId>).
5. O usa turbo dev para arrancar los proyectos en simultaneo.
5. Inicia sesión con Clerk, crea/selecciona una organización y comienza a probar conversaciones y la base de conocimiento.

## Scripts útiles (raíz)
- `pnpm dev`: modo desarrollo con Turborepo (no cacheado).
- `pnpm build`: build de todos los paquetes/apps.
- `pnpm lint`: lint sobre el monorepo.
- `pnpm format`: prettier sobre `ts/tsx/md`.
- `pnpm --filter web typecheck` / `pnpm --filter widget typecheck`: chequeo de tipos por app.
- `pnpm --filter @workspace/backend dev`: servidor Convex local.

## Funcionalidades destacadas
- **Asistente IA multilenguaje**: Vera opera con instrucciones en español, busca primero en la base de conocimiento y puede escalar/resolver conversaciones desde Convex.
- **Gestión de conversaciones**: estados `unresolved → escalated → resolved`, realce automático de respuestas del operador y scroll infinito de hilos.
- **Base de conocimiento con RAG**: subida, parsing y eliminación de documentos, almacenados en Convex Storage y embebidos con OpenAI para búsqueda semántica.
- **Widget embebible**: flujo de autenticación ligera (nombre/email), creación de sesión de contacto con metadatos del navegador y transición a chat/inbox; listo para añadir voz vía Vapi.
- **UI compartida**: componentes shadcn/ui centralizados en `packages/ui` (botones, inputs, AI chat UI, etc.), listos para reutilizar en apps y widget.

## Uso de la librería UI
- Importa componentes desde `@workspace/ui`, p.ej.: `import { Button } from "@workspace/ui/components/button"`.
- Para agregar nuevos componentes con el generador de shadcn en `apps/web`: `pnpm dlx shadcn@latest add button -c apps/web`. Los archivos vivirán en `packages/ui/src/components`.

## Despliegue
- Next.js: ejecuta `pnpm --filter web build` y/o `pnpm --filter widget build`, configura las mismas variables de entorno en tu hosting.
- Convex: usa `pnpm dlx convex deploy` (o `npx convex deploy`) desde `packages/backend/convex` con `CONVEX_DEPLOYMENT` apuntando al proyecto en la nube.

## Notas de desarrollo
- El repositorio asume organizaciones de Clerk: el middleware redirige a selección de organización si falta.
- Si añades nuevas fuentes de datos para la base de conocimiento, revisa `packages/backend/convex/system/ai/rag.ts` para alinear modelo/dimensión de embeddings.
- El hook de Vapi (`apps/widget/modules/widget/hooks/use-vapi.ts`) está listo pero espera una clave pública; ajusta el inicio de `Vapi`/`start` antes de usarlo en producción.
