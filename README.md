# Music Rating App

Aplicación web para calificar y reseñar álbumes de música, al estilo de Letterboxd pero para discos. Los datos de álbumes y artistas vienen de la iTunes Search API, así que no hay catálogo musical propio que mantener.

> Proyecto personal en desarrollo. Lo que aparece en "Funcionalidades" ya está implementado; lo pendiente está al final.

## Funcionalidades

- **Inicio y búsqueda:** top de álbumes de iTunes con su calificación promedio, y búsqueda de álbumes y artistas.
- **Detalle de álbum y de artista:** portada, lista de canciones, reseñas de otros usuarios y discografía del artista.
- **Calificaciones y reseñas:** de 1 a 5 estrellas, con texto opcional y fecha de escucha. Una reseña por usuario y álbum, editable.
- **Diario:** las reseñas del usuario agrupadas por fecha de escucha.
- **Por escuchar:** lista personal de álbumes pendientes.
- **Listas:** listas de álbumes creadas por el usuario, públicas o privadas.
- **Perfiles y seguimiento:** perfil con reseñas, diario y pendientes; seguir y dejar de seguir a otros usuarios.
- **Feed:** actividad reciente de todos o solo de los usuarios seguidos.
- **Autenticación:** registro con correo y contraseña (hash con bcrypt) o inicio de sesión con GitHub.

## Tecnologías

| Tecnología | Uso |
|---|---|
| Next.js 16 (App Router) | Framework full stack: Server Components y Server Actions |
| React 19 + TypeScript | Interfaz y tipado |
| Tailwind CSS 4 | Estilos |
| Prisma 6 + MySQL | ORM, migraciones y base de datos |
| NextAuth.js 4 | Autenticación (credenciales y GitHub OAuth) |
| iTunes Search API | Catálogo de álbumes y artistas |

## Arquitectura

```
Navegador  <->  Next.js (Server Components + Server Actions)  <->  iTunes Search API
                                |
                           Prisma ORM
                                |
                              MySQL
```

- Las páginas son Server Components: consultan iTunes y la base de datos en el servidor.
- Las mutaciones (calificar, seguir, listas, pendientes) son Server Actions en `actions/`.
- No hay API propia; la única ruta de API es la de NextAuth.

La documentación técnica completa está en [DOCUMENTATION.md](DOCUMENTATION.md).

## Cómo ejecutarlo

Requisitos: Node.js 20 o superior y una base de datos MySQL.

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo .env a partir del ejemplo y llenar los valores
cp .env.example .env

# 3. Crear las tablas
npx prisma migrate dev

# 4. Iniciar el servidor de desarrollo
npm run dev
```

Después abre http://localhost:3000.

Variables de entorno:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a MySQL |
| `NEXTAUTH_URL` | URL de la app (en local, `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Secreto para firmar las sesiones |
| `GITHUB_ID`, `GITHUB_SECRET` | Credenciales de la OAuth App de GitHub (solo para el login con GitHub) |

## Estructura

```
actions/      Server Actions: auth, rating, toListen, follow, playlist
app/          Rutas: inicio, album, artist, feed, lists, list, users, login, register
components/   Componentes de UI: auth, layout, music, user
lib/          Cliente de iTunes, singleton de Prisma, promedios de calificaciones
prisma/       Esquema y migraciones
types/        Tipos de iTunes y de sesión
```

## Pendiente

- Migrar las etiquetas `<img>` a `next/image`.
- Registro de actividad y notificaciones cuando un usuario seguido publica una reseña.
- Listas colaborativas.
- Selector de tema claro u oscuro.
