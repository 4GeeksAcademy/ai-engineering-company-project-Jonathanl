# Contexto del Tech Lead

## Asunto
**Monorepo AI Setup — necesitamos esto esta semana**

---

Hola,

He revisado el estado del repo y estamos empezando **sin estructura de soporte**. Si meto un agente sobre esto ahora mismo va a cometer errores que nos van a costar el triple de tiempo.

### Qué necesito

1. **Banco de memoria**  
   El repositorio debe tener un contexto claro y persistente antes de seguir añadiendo features:
   - Qué es la empresa
   - Qué estamos construyendo
   - Cuáles son las reglas del proyecto  

   Eso va al **banco de memoria**.  
   El agente **tiene que leerlo antes de tocar nada**.  
   Debe incluir **tanto el contexto de negocio como el técnico** (no solo uno de los dos).

2. **AGENTS.md**  
   Debe definir cómo opera cualquier agente en este repo:
   - Qué flujo tiene que seguir **antes de hacer un commit**
   - Nada de agentes que escriban código sin pasar por el proceso de entrega

3. **Carpeta `.agents/`**  
   Para las reglas más específicas.  
   Piensa en qué convenciones necesita conocer el agente para no romper lo que ya tenemos, y documéntalas ahí con el **alcance correcto**.

4. **Al menos una Skill**  
   Formalizar al menos una skill que capture una **tarea recurrente** de nuestro flujo de trabajo:
   - Algo que el agente pueda ejecutar de forma consistente
   - Reutilizable a medida que el proyecto crezca
   - Con **criterios de aceptación explícitos**  
     > Si no se puede verificar, no vale.

### Capa de aplicación

**No inventes un árbol paralelo.**

Cuando se creen las apps, van en las carpetas que ya mapea la plantilla:

| Carpeta              | Uso                                      |
|----------------------|------------------------------------------|
| `./uis/website`      | Sitio público                            |
| `./uis/backoffice`   | App interna                              |
| `/services`          | APIs                                     |

> Lee el `README` de cada carpeta **antes de poner nada ahí**.

Cuando termines: **abre la PR y avísame**.

— [Tu tech lead]

---

## 💡 Banco de memoria, reglas y skills: qué son y por qué importan

### Banco de memoria
Es un conjunto de archivos Markdown que el agente de programación **lee antes de cada sesión**.

No es documentación estática — es el **contexto activo del proyecto**:
- Negocio
- Decisiones de arquitectura tomadas
- Restricciones en vigor
- Estado actual del desarrollo

**Sin él**, cada sesión del agente empieza desde cero y repite los mismos errores.

Por eso, el banco de memoria **debe actualizarse** cada vez que el proyecto evoluciona:
- Nuevas decisiones
- Cambios de arquitectura
- Features completadas
- Problemas encontrados

> Un banco de memoria que no se mantiene al día deja de ser útil en cuestión de días.  
> **¡Nunca lo olvides!**

### Estructura esperada

```text
./.agents
├── /rules
│   └── <rule-name>.md
└── /skills
    └── /<skill>
        └── SKILL.md

./memory-bank
└── <context>.md