# Miunix Structure

Estructura base sugerida para seguir creciendo el proyecto sin mezclar integraciones, UI y tipos.

## app

- `app/(dashboard)`: rutas privadas o de producto.
- `app/(auth)`: login, registro, recuperacion y callbacks.
- `app/api`: route handlers para webhooks, acciones server-to-server y endpoints internos.
- `app/_components`: componentes exclusivos de una seccion del App Router.
- `app/_lib`: helpers privados ligados a rutas especificas.

## components

- `components/ui`: componentes generados con `shadcn/ui`.
- `components/layout`: shell, sidebar, header, wrappers.
- `components/forms`: formularios y campos compuestos.
- `components/chat`: bloques para conversaciones, mensajes y estados de agentes.
- `components/shared`: piezas reutilizables entre marketing, dashboard y auth.

## lib

- `lib/openai`: clientes, prompts y servicios de IA.
- `lib/supabase`: clientes, queries y auth.
- `lib/env`: acceso centralizado a variables de entorno.
- `lib/validators`: esquemas y validaciones.

## types

- `types/database.ts`: tipos de base de datos.
- `types/openai.ts`: tipos de mensajes, modelos y salidas.
- `types/index.ts`: barrel de tipos compartidos.

## utils

- `utils/constants.ts`: constantes de aplicacion.
- `utils/format.ts`: formateadores puros.
- `utils/index.ts`: barrel de utilidades.
