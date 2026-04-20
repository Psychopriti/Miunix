# Guia de Trabajo en Equipo para Miunix

Esta guia esta pensada para dos equipos:

- equipo `Frontend`
- equipo `Backend/AI`

La idea es que todos puedan trabajar en paralelo sin romper el proyecto ni confundirse con Git.

## 1. Objetivo de esta guia

Esta guia define:

- que carpetas y archivos toca cada equipo
- que archivos deben tocar entre ambos con cuidado
- como crear ramas
- como hacer commits
- como subir cambios
- como pedir revision
- como evitar conflictos

## 2. Estructura actual del proyecto

Las carpetas principales del proyecto son estas:

```text
app/
components/
lib/
types/
utils/
public/
supabase/
ai/
prompts/
```

## 3. Reparto de trabajo por equipo

### Equipo Frontend

El equipo Frontend es responsable de todo lo visual y de la experiencia del usuario.

#### Carpetas principales que toca Frontend

- `app/`
- `components/`
- `public/`
- `app/globals.css`
- `app/layout.tsx`

#### Que hace Frontend ahi

- crear paginas y vistas
- construir layouts
- crear componentes reutilizables
- hacer formularios
- aplicar estilos
- hacer responsive
- conectar botones, navegacion y flujo visual
- mostrar datos que ya existan

#### Carpetas mas comunes para Frontend

- `app/page.tsx`
- `app/marketplace/`
- `components/layout/`
- `components/forms/`
- `components/chat/`
- `components/shared/`
- `components/ui/`
- `components/marketing/`
- `public/`

### Equipo Backend/AI

El equipo Backend/AI es responsable de logica, integraciones, base de datos, endpoints y comportamiento de los agentes.

#### Carpetas principales que toca Backend/AI

- `app/api/`
- `lib/`
- `types/`
- `utils/`
- `supabase/`
- `ai/`
- `prompts/`

#### Que hace Backend/AI ahi

- crear endpoints
- conectar OpenAI
- conectar Supabase
- manejar autenticacion
- definir tipos de datos
- crear validaciones
- escribir prompts
- crear helpers de negocio
- manejar acciones del servidor

#### Carpetas mas comunes para Backend/AI

- `app/api/run-agent/route.ts`
- `lib/openai/`
- `lib/supabase/`
- `lib/validators/`
- `types/`
- `utils/`
- `prompts/`
- `supabase/`
- `ai/`

## 4. Carpetas compartidas

Hay carpetas o archivos que ambos equipos pueden necesitar tocar. Ahi hay que tener mas cuidado.

### Archivos compartidos con cuidado

- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `components/ui/`
- `types/`
- `lib/site.ts`
- `lib/utils.ts`

### Regla para archivos compartidos

Si alguien va a tocar un archivo compartido:

1. avisa por el grupo
2. di que archivo vas a tocar
3. di para que lo vas a tocar
4. intenta hacer cambios pequenos
5. sube esos cambios rapido

Ejemplo:

```text
Voy a tocar app/layout.tsx para agregar el header global.
No toquen ese archivo en la proxima hora.
```

## 5. Regla simple de ownership

Para que no se pisen, usen esta regla:

- Frontend manda en UI, paginas, estilos y componentes
- Backend/AI manda en datos, API, integraciones, prompts y logica

Si un cambio mezcla ambas cosas:

- Frontend prepara la interfaz
- Backend/AI conecta la logica

Ejemplo:

- Frontend crea la pantalla del chat
- Backend/AI conecta el endpoint que responde el chat

## 6. Como nombrar ramas

Cada tarea debe ir en su propia rama.

Formato recomendado:

```text
frontend/nombre-corto-de-la-tarea
backend/nombre-corto-de-la-tarea
ai/nombre-corto-de-la-tarea
fix/nombre-corto-del-error
```

Ejemplos:

```text
frontend/home-marketplace
frontend/agent-detail-ui
backend/supabase-auth
backend/run-agent-endpoint
ai/prompts-market-research
fix/navbar-mobile
```

## 7. Rama principal del proyecto

Usen estas reglas:

- `main` debe quedar siempre estable
- nadie trabaja directo en `main`
- nadie hace commit directo en `main`
- todo cambio entra a `main` por Pull Request

## 8. Flujo de Git recomendado

Este es el flujo que todos deben seguir.

### Paso 1. Antes de empezar

Cambiate a `main`:

```bash
git checkout main
```

Trae lo ultimo:

```bash
git pull origin main
```

### Paso 2. Crea tu rama

Ejemplo Frontend:

```bash
git checkout -b frontend/home-marketplace
```

Ejemplo Backend:

```bash
git checkout -b backend/run-agent-endpoint
```

### Paso 3. Haz tus cambios

Trabaja solo en los archivos de tu tarea.

### Paso 4. Revisa que cambiaste

```bash
git status
```

Para ver diferencias:

```bash
git diff
```

### Paso 5. Guarda tus cambios en commits pequenos

Agrega archivos:

```bash
git add .
```

Haz commit:

```bash
git commit -m "create marketplace cards UI"
```

### Paso 6. Sube tu rama

```bash
git push -u origin frontend/home-marketplace
```

### Paso 7. Abre Pull Request

Cuando termines:

- abre un Pull Request hacia `main`
- explica que hiciste
- pide revision al otro equipo si el cambio los afecta

## 9. Como escribir commits

Los commits deben ser cortos y claros.

Formato recomendado:

```text
tipo: cambio
```

Ejemplos:

```text
feat: add marketplace page
feat: connect run-agent endpoint
fix: correct navbar spacing
fix: validate empty prompt input
refactor: move agent data to lib
style: update marketplace cards
```

## 10. Regla importante para principiantes

No hagan esto:

- no trabajen todos en la misma rama
- no hagan commit directo en `main`
- no suban archivos rotos sin avisar
- no usen `git push --force` si no entienden bien que hace
- no borren ramas de otros
- no hagan cambios gigantes en un solo commit

Si no entienden un comando, paren y pregunten antes de ejecutarlo.

## 11. Como dividir el trabajo de este proyecto

### Lo ideal para Frontend

- construir la home
- construir marketplace
- construir detalle de agente
- construir dashboard visual
- construir login y formularios
- manejar estilos, responsive e interacciones visuales

### Lo ideal para Backend/AI

- crear auth con Supabase
- crear endpoints en `app/api/`
- conectar modelos de IA
- manejar prompts en `prompts/`
- crear logica de agentes
- guardar resultados y conversaciones
- crear tipos y validaciones

## 12. Ejemplo real de trabajo en paralelo

### Frontend puede trabajar en

- `app/marketplace/page.tsx`
- `app/marketplace/[slug]/page.tsx`
- `components/layout/site-header.tsx`
- `components/marketing/`
- `app/globals.css`

### Backend/AI puede trabajar en

- `app/api/run-agent/route.ts`
- `lib/openai/`
- `lib/supabase/`
- `prompts/`
- `types/openai.ts`

Asi ambos avanzan al mismo tiempo sin tocar exactamente lo mismo.

## 13. Como evitar conflictos de merge

### Regla 1

Un ticket o tarea debe tener un solo responsable principal.

### Regla 2

Si dos personas necesitan el mismo archivo, hablen antes.

### Regla 3

Suban cambios pequenos y frecuentes.

### Regla 4

No esperen varios dias para hacer push.

### Regla 5

Antes de abrir PR, actualicen su rama con `main`.

## 14. Como actualizar tu rama con main

Primero trae los cambios remotos:

```bash
git checkout main
git pull origin main
```

Luego vuelve a tu rama:

```bash
git checkout frontend/home-marketplace
```

Haz merge de `main` en tu rama:

```bash
git merge main
```

Si hay conflictos:

1. abre el archivo
2. busca las marcas de conflicto
3. decide que codigo se queda
4. guarda el archivo
5. haz `git add .`
6. haz `git commit`

## 15. Como revisar un Pull Request

Antes de aprobar algo, revisen:

- si compila
- si no rompe otra parte
- si el nombre de variables se entiende
- si el codigo esta ordenado
- si el cambio hace solo lo que prometio
- si no metio archivos innecesarios

## 16. Checklist antes de hacer push

Antes de subir cambios, revisa esto:

- hice cambios solo de mi tarea
- no toque archivos de otro equipo sin avisar
- el proyecto compila
- el nombre del branch esta claro
- el commit message esta claro
- revise `git status`

## 17. Comandos de Git que todos deben saber

Ver estado:

```bash
git status
```

Ver ramas:

```bash
git branch
```

Cambiar de rama:

```bash
git checkout nombre-de-rama
```

Crear rama:

```bash
git checkout -b nueva-rama
```

Agregar cambios:

```bash
git add .
```

Hacer commit:

```bash
git commit -m "feat: ejemplo"
```

Subir rama:

```bash
git push -u origin nombre-de-rama
```

Traer cambios:

```bash
git pull origin main
```

## 18. Acuerdo simple entre equipos

### Frontend promete

- no tocar logica de backend sin avisar
- no cambiar tipos compartidos sin avisar
- no romper rutas API

### Backend/AI promete

- no cambiar componentes visuales sin avisar
- no cambiar estructura de paginas sin avisar
- no romper props de componentes usados por Frontend

## 19. Regla final

Si algo puede romper el trabajo del otro equipo:

- no lo subas sin avisar
- no asumas
- pregunta primero

Trabajar en equipo no es solo usar Git.
Tambien es comunicar bien que estas tocando.

## 20. Recomendacion final para este proyecto

Empiecen asi:

### Equipo Frontend

1. definir todas las pantallas
2. crear componentes visuales
3. dejar props listas para datos reales

### Equipo Backend/AI

1. definir datos que necesita cada pantalla
2. crear endpoints y servicios
3. acordar con Frontend el formato de respuesta

### Luego ambos

1. conectar frontend con backend
2. probar flujos completos
3. corregir errores pequenos
4. recien despues optimizar

## 21. Nombre sugerido del documento

Este archivo se llama:

```text
GUIA_EQUIPOS_GIT.md
```

Lo pueden abrir en VS Code, GitHub o navegador.
Si despues quieren, se puede convertir a PDF.
