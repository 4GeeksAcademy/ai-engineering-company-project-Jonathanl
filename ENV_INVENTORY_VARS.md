# Variables de Entorno Requeridas para Inventario (Supabase)

Añade estas líneas a tu `.env` con tus credenciales reales de Supabase:

```
# Supabase - PostgreSQL Connection
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT_ID.supabase.co:5432/postgres?sslmode=require
```

**Formato exacto:**
- `postgresql://` (protocolo)
- `postgres:PASSWORD` (usuario:contraseña)
- `@YOUR_PROJECT_ID.supabase.co:5432/postgres` (host:puerto/db)
- `?sslmode=require` (SSL obligatorio)

**Ejemplo real (NO uses este):**
```
DATABASE_URL=postgresql://postgres:abc123xyz@qwerty12345.supabase.co:5432/postgres?sslmode=require
```

**Después de añadir a `.env`, este archivo se puede eliminar.**
