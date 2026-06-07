# Music Rating App — Documentación Técnica

## Descripción General

Aplicación web tipo "Letterboxd para música". Los usuarios pueden buscar álbumes (vía iTunes API), calificarlos con estrellas (1-5), escribir reseñas, mantener un diario personal, crear una lista de "Por Escuchar", y ver actividad reciente de la comunidad.

---

## Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| **Next.js** (App Router) | 16.1.6 | Framework fullstack (SSR + RSC + Server Actions) |
| **React** | 19.2.3 | UI |
| **TypeScript** | ^5 | Tipado |
| **Tailwind CSS** | v4 | Estilos utilitarios |
| **Prisma** | ^6.19.2 | ORM + Migraciones |
| **MySQL** (local) | — | Base de datos |
| **NextAuth.js** | ^4.24.13 | Autenticación (Credentials + GitHub OAuth) |
| **bcryptjs** | ^3.0.3 | Hash de contraseñas |
| **iTunes Search API** | — | Fuente de datos de música |

---

## Arquitectura

### Patrón: Next.js App Router + Server Components + Server Actions

```
Cliente (Browser)  ←→  Next.js Server  ←→  iTunes API
                         ↓
                     Prisma ORM
                         ↓
                     MySQL DB
```

- **Server Components** (por defecto en App Router): renderizan en servidor, fetch de datos directo.
- **Client Components** (`'use client'`): interactividad (formularios, hover, estados locales).
- **Server Actions** (`'use server'`): mutaciones (rating, to-listen, follow, register).
- **RSC (React Server Components)**: los datos viajan serializados, no hay API routes propias (salvo NextAuth).

### Flujo de datos típico (ej: página de álbum)

1. El Server Component `app/album/[id]/page.tsx` hace fetch a iTunes API + consulta Prisma.
2. Renderiza HTML incluyendo Client Components (`StarRating`, `ToListenButton`).
3. El usuario interactúa → Server Action via fetch → Prisma → `revalidatePath` → refresco.

---

## Estructura del Proyecto

```
music-rating-app/
├── actions/                  # Server Actions (mutaciones)
│   ├── auth.ts               #   registerUser
│   ├── rating.ts             #   saveRating (crear/actualizar reseña)
│   ├── toListen.ts           #   toggleToListen (agregar/quitar de "Por Escuchar")
│   └── actions/follow.ts     #   followUser (seguir/dejar de seguir)
│
├── app/                      # App Router (Next.js 16)
│   ├── layout.tsx            #   Layout raíz: Sidebar + SessionProvider
│   ├── page.tsx              #   Home: top 20 álbumes iTunes + ratings promedio
│   ├── globals.css           #   Tailwind + variables CSS
│   ├── album/[id]/page.tsx   #   Detalle de álbum: info, tracks, reseñas, rating
│   ├── api/auth/[...nextauth]/route.ts  # NextAuth handler
│   ├── diary/page.tsx        #   Diario personal del usuario (sus reseñas)
│   ├── feed/page.tsx         #   Feed social (últimas reseñas de todos)
│   ├── login/page.tsx        #   Login (credentials + GitHub)
│   ├── register/page.tsx     #   Registro (nombre, email, password)
│   ├── search/page.tsx       #   Búsqueda de álbumes vía iTunes
│   ├── to-listen/page.tsx    #   Lista "Por Escuchar" del usuario
│   └── users/page.tsx        #   Lista de usuarios (incompleto)
│
├── components/
│   ├── auth/AuthButton.tsx   #   Botón login/logout + info sesión
│   ├── layout/Sidebar.tsx    #   Barra lateral de navegación
│   ├── music/ReviewCard.tsx  #   Card de reseña (usuario, estrellas, texto)
│   ├── music/SearchBar.tsx   #   Input de búsqueda con submit
│   ├── music/StarRating.tsx  #   Selector de estrellas + textarea + submit
│   ├── music/ToListenButton.tsx  # Botón toggle "Por Escuchar"
│   └── user/FollowButton.tsx #   (vacío - pendiente)
│
├── lib/
│   ├── prisma.ts             #   Singleton de PrismaClient
│   └── generated/prisma/     #   Cliente Prisma generado (gitignored)
│
├── providers/
│   └── SessionProvider.tsx   #   Wrapper de NextAuth SessionProvider
│
├── types/
│   ├── itunes.ts             #   Interface Album para top albums
│   └── database.ts           #   (vacío)
│
├── prisma/
│   ├── schema.prisma         #   Esquema de base de datos
│   └── migrations/           #   Migraciones SQL
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── prisma.config.ts          #   Config de Prisma (con dotenv)
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## Base de Datos (Prisma)

### Modelos

```
User
  id            String   @id @default(cuid())
  name          String?
  email         String?  @unique
  password      String?           ← bcrypt hash (nullable: usuarios GitHub no tienen)
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  reviews       Review[]
  toListen      ToListen[]
  followers     User[]   @relation("UserFollows")
  following     User[]   @relation("UserFollows")

Review
  id         String   @id @default(uuid())
  rating     Int                  ← 1-5
  text       String?  @db.Text
  albumId    String               ← ID de iTunes
  listenedAt DateTime @default(now())  ← fecha de escucha (elegida por el usuario)
  createdAt  DateTime @default(now())
  userId    String
  user      User     @relation
  @@unique([userId, albumId])   ← un usuario = una reseña por álbum

ToListen
  id        String   @id @default(cuid())
  albumId   String
  userId    String
  user      User     @relation
  createdAt DateTime @default(now())
  @@unique([userId, albumId])

Account   (NextAuth — OAuth accounts)
Session   (NextAuth — sesiones)
```

### Notas sobre la DB

- Se creó una migración baseline `0_init` que refleja el schema actual.
- Migración `add_listened_at` agrega el campo `listenedAt` a `Review` para registrar la fecha de escucha.
- Para cambios futuros al schema: `npx prisma migrate dev --name descripcion_del_cambio`
- Para producción: `npx prisma migrate deploy`
- Todos los archivos usan el singleton `import { prisma } from '@/lib/prisma'`.

---

## Rutas y Funcionalidad

| Ruta | Tipo | Descripción |
|---|---|---|
| `/` | Server | Top 20 álbumes iTunes + rating promedio de cada uno |
| `/album/[id]` | Server | Detalle: portada, tracks, reseñas, calificar, "Por Escuchar" |
| `/search?q=` | Server | Resultados de búsqueda iTunes (deduplicados) |
| `/login` | Client | Login con email/password o GitHub |
| `/register` | Client | Registro con nombre, email, password |
| `/diary` | Server | Diario personal del usuario (solo autenticado) |
| `/feed` | Server | Feed social con últimas 50 reseñas |
| `/to-listen` | Server | Lista "Por Escuchar" del usuario (solo autenticado) |
| `/users` | Server | Lista de usuarios (incompleto) |
| `/api/auth/[...nextauth]` | API | Handler de NextAuth |

---

## Server Actions

| Acción | Archivo | Descripción |
|---|---|---|
| `registerUser(formData)` | `actions/auth.ts` | Crea usuario con bcrypt |
| `saveRating(albumId, rating, text?)` | `actions/rating.ts` | Crea o actualiza reseña (upsert manual) |
| `toggleToListen(albumId)` | `actions/toListen.ts` | Agrega/quita de "Por Escuchar" |
| `followUser(targetUserId)` | `actions/follow.ts` | Sigue/deja de seguir usuario |

---

## Componentes Clave

- **`StarRating`**: Client component. Muestra 5 estrellas clickeables + textarea opcional + date picker para la fecha de escucha. Hace submit vía `saveRating` server action. Soporta edición (si ya hay reseña).
- **`lib/api.ts`**: Helpers compartidos para iTunes API (`getTopAlbums`, `lookupAlbums`, `lookupAlbumWithTracks`, `searchAlbums`). Todos con try-catch y manejo de errores centralizado.
- **`lib/ratings.ts`**: Helper `getAverageRatingsMap` para obtener el promedio de reseñas agrupado por `albumId`.
- **`ToListenButton`**: Client component. Toggle para agregar/quitar álbum de la lista "Por Escuchar".
- **`ReviewCard`**: Muestra reseña con avatar, nombre, estrellas, texto. Reutilizado en feed, álbum, diario.
- **`SearchBar`**: Input + botón que redirige a `/search?q=...`.
- **`Sidebar`**: Nav lateral con enlaces condicionales (si hay sesión).

---

## Cómo Ejecutar

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env (ver .env.example)
#    DATABASE_URL, NEXTAUTH_SECRET, GITHUB_ID, GITHUB_SECRET

# 3. Sincronizar base de datos
npx prisma migrate dev

# 4. Iniciar dev server
npm run dev
# Abrir http://localhost:3000
```

---

## Problemas / Deuda Técnica (Resueltos)

- ✅ **Migración desactualizada**: La migración `0_init` ahora refleja el schema actual exacto.
- ✅ **Múltiples instancias de PrismaClient**: Todos los archivos usan el singleton `@/lib/prisma`.
- ✅ **`actions/actions/follow.ts` movido a `actions/follow.ts`**: Consistente con las demás actions.
- ✅ **`/users` page renombrada**: La función es `UsersPage`.
- ✅ **`useEffect` con setState en `StarRating`**: Eliminado (ahora usa `key` para remontar).
- ✅ **Código duplicado de iTunes API**: Extraído a `lib/api.ts` (DRY).
- ✅ **Código duplicado de ratings**: Extraído a `lib/ratings.ts` (DRY).
- ✅ **Manejo de errores**: Todos los fetch a iTunes tienen try-catch con logging.
- ✅ **Tipos eliminados**: `any` reemplazados por `ITunesAlbum` en search y api.
- ✅ **Import no usados**: `signIn` y `StarRating` eliminados.

## Problemas / Deuda Técnica Pendientes

1. **`types/database.ts` vacío**: Podría tipar los modelos de Prisma.
2. **`<img>` en vez de `<Image />`**: 10 warnings de lint. Migrar a `next/image` para optimización.
3. **Prisma Client EPERM**: Error de permisos en Windows al generar el client (no bloqueante).

---

## Corrección de Datos de Prueba
- Se eliminaron los IDs de álbumes inválidos (que no existen en iTunes) y se reemplazaron con IDs verificados (10/10 confirmados vía iTunes Lookup API).
- Los usuarios Carreon, Stiven y Vega ahora tienen reseñas con álbumes reales que muestran portada, nombre y artista correctamente.

## Date Picker y Diario por Fechas
- **`listenedAt`**: Nuevo campo en `Review` para registrar la fecha en que el usuario escuchó el disco.
- **Date picker** en `StarRating`: input `<input type="date">` para elegir la fecha de escucha al calificar.
- **Diario agrupado por fechas**: Las reseñas se muestran agrupadas por día (encabezados tipo "6 de junio de 2026 (3 discos)"), ordenadas de más reciente a más antigua según `listenedAt`.
- **Seed data corregida**: Los usuarios de prueba tienen reseñas con IDs de iTunes válidos.

## Features Implementados Anteriormente

### Sistema de Follows
- **`components/user/FollowButton.tsx`**: Botón "Seguir/Siguiendo" que usa la server action `followUser`. Se oculta automáticamente si es el propio perfil.
- **`types/next-auth.d.ts`**: Extensión del tipo `Session` para incluir `user.id`.
- **Session callback** en NextAuth para pasar el `id` del usuario en el token JWT.

### Página de Perfil `/users/[id]`
- Muestra avatar, nombre, estadísticas (reseñas, seguidores, siguiendo).
- Lista de reseñas del usuario con portadas y enlaces al álbum.
- Botón "Seguir" si no es el propio perfil.
- Ruta protegida con `notFound()` si el usuario no existe.

### Lista de Usuarios `/users`
- Rediseñada con cards, avatares, conteo de reseñas y seguidores.
- Enlace al perfil de cada usuario.

### Feed Personalizado `/feed?filter=siguiendo`
- Tabs "Todos" / "Siguiendo" (solo visible si hay sesión).
- Filtro "Siguiendo" muestra reseñas de usuarios seguidos + las propias.
- Mensaje vacío contextual según el filtro activo.

### Sidebar Actualizada
- Enlaces directos a: Feed, Usuarios, Mi Perfil, Por Escuchar, Mi Diario.
- Enlace "Mi Perfil" dinámico apunta a `/users/[id]` del usuario logueado.
- Active state corregido con `pathname.startsWith` para rutas anidadas.

### ReviewCard
- Nombre del usuario enlaza a su perfil (`/users/[id]`).
- Interfaz extendida para incluir `user.id` opcional.

---

## Mi Opinión sobre el Proyecto (Actualizada)

**Muy buen avance para ser un MVP.** La arquitectura es limpia y moderna (Server Components + Server Actions), el uso de la iTunes API evita tener una base de datos musical propia, y la UI con Tailwind v4 se ve limpia y consistente (dark theme, hover effects, transiciones).

**Puntos fuertes:**
- Separación clara entre Server/Client Components
- Server Actions bien tipadas con manejo de errores
- Diseño responsive (grid adaptable)
- Autenticación dual (credentials + GitHub)
- Revalidación eficiente con `revalidatePath`
- Código DRY con helpers compartidos (`lib/api.ts`, `lib/ratings.ts`)
- Singleton de PrismaClient centralizado
- Migraciones sincronizadas correctamente

**Debilidades restantes:**
- `<img>` sin optimizar (migrar a `next/Image`)
- `FollowButton.tsx` sin implementar
- Perfil de usuario `/users/[id]` no existe
- Feed no personalizado por follows

---

## Siguiente Paso Recomendado

**Feature: Actividad en Vivo / Notificaciones**

Con el loop social completo (registro → buscar → calificar → seguir → feed), el siguiente paso es agregar persistencia y descubrimiento:

1. **ActivityLog en Prisma** — Modelo para registrar acciones (reseñó, agregó a "Por Escuchar", empezó a seguir). Esto permite mostrar "Juan reseñó Abbey Road hace 2h" en el feed.
2. **Notificaciones** — Avisar al usuario cuando alguien que sigue reseña un disco.
3. **Playlists / Listas colaborativas** — Permitir crear listas de discos compartidas.
4. **Modo oscuro / claro** — Selector de tema con persistencia en localStorage.
