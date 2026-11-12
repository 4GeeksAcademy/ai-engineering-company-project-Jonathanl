# Reglas de desarrollo Nexova

**Alcance:** siempre activa para cualquier cambio dentro de este repositorio. Prevalece la regla más específica si una instrucción local define un requisito más estricto.

- Lee los tres archivos de `memory-bank/` al inicio de cada sesión, como indica `AGENTS.md`; consulta `BRIEFING.md` para requisitos de negocio vigentes.
- Respeta la estructura de la plantilla: interfaz en `uis/`, API/servicios en `services/`, datos en `data/`, agentes en `agents/`; no crees árboles paralelos. Lee el README del área antes de añadir código.
- Ubicación de aplicaciones: `uis/website/` para el sitio público, `uis/backoffice/` para la aplicación interna y `services/` para APIs/servicios. Mantén website y backoffice separados; las páginas de backoffice ya existentes no convierten a `uis/talent-pipeline/` en sustituto de esas rutas. Este hito solo documenta las ubicaciones, no pide crear ni mover aplicaciones.
- Distingue capacidades existentes de necesidades futuras: el briefing es contexto y no prueba que una feature, integración o métrica ya esté implementada.
- Usa datos ficticios en fixtures, documentación y demostraciones. No añadas PII de candidatos, empleados o clientes a logs, respuestas innecesarias, commits ni ejemplos.
- Para ranking o matching de candidatos, documenta criterios y evidencia; deja revisión y decisión final a una persona. No infieras atributos protegidos ni uses proxies discriminatorios.
- No toques secretos, estado persistente, datos reales, integraciones con efectos externos, despliegues o cambios destructivos sin aprobación explícita.
- Antes de commit, completa en orden el flujo de validación, revisión de diff, seguridad y actualización de memoria/documentación definido en `AGENTS.md`; no hagas commit o PR sin autorización.
- Ante contradicciones del briefing (por ejemplo, nombres de responsables distintos entre secciones), detente y pide aclaración antes de codificar el dato como verdad operativa.
