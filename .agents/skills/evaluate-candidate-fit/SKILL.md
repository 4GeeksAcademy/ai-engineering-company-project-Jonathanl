---
name: evaluate-candidate-fit
description: Compara perfiles ficticios con requisitos explícitos de una vacante y produce un ranking explicable para revisión humana.
---

# Evaluar ajuste de candidatos a una vacante

## Objetivo

Generar una comparación trazable entre una vacante y un conjunto de perfiles **ficticios**, usando únicamente requisitos laborales proporcionados. El resultado sirve como apoyo para la revisión humana y no decide contratación ni rechazo.

## Inputs

Proporciona todos los siguientes elementos:

1. **Vacante:** título y descripción/responsabilidades.
2. **Requisitos obligatorios:** lista explícita y observable, como experiencia mínima relevante, habilidades o nivel de idioma cuando sea requisito del puesto.
3. **Requisitos deseables:** lista separada de criterios que no son excluyentes.
4. **Candidatos ficticios:** identificador no personal y evidencia textual breve por candidato. No incluyas nombre, email, teléfono, dirección, foto, fecha de nacimiento ni otros datos personales o sensibles.
5. **Ponderaciones (opcional):** pesos por criterio; si no se entregan, no inventes pesos numéricos ni un score probabilístico. Usa una matriz cualitativa de evidencia.

Si falta la vacante, los criterios o evidencia suficiente, pide aclaración; no rellenes vacíos con suposiciones.

## Procedimiento

1. Extrae los requisitos explícitos y sepáralos en obligatorios y deseables; conserva su significado sin agregar criterios.
2. Para cada candidato, asigna por criterio uno de: `evidencia`, `evidencia parcial`, `sin evidencia` o `contradicción`. Cita el fragmento de evidencia aportado, o indica que no se proporcionó.
3. Resume fortalezas y brechas con relación directa a los requisitos. No infieras competencia a partir de datos demográficos, nombres, instituciones o información no relacionada.
4. Ordena primero por cumplimiento documentado de requisitos obligatorios y después por evidencia de requisitos deseables. Si hay empate o evidencia insuficiente, decláralo; no fabriques precisión.
5. Incluye limitaciones y recomienda revisión humana antes de cualquier decisión laboral.

## Formato de salida

- **Resumen de criterios:** obligatorios y deseables usados.
- **Tabla comparativa:** candidato ficticio, estado por requisito obligatorio, evidencia, deseables y limitaciones.
- **Orden orientativo:** ranking explicable, incluyendo empates o casos no evaluables.
- **Revisión humana:** advertencia clara de que el resultado no es una decisión de contratación.

## Criterios de aceptación verificables

La salida se acepta solo si cumple todos los puntos:

- Todos los requisitos usados aparecen en los inputs y están clasificados como obligatorios o deseables.
- Cada candidato de entrada aparece exactamente una vez en la tabla y el ranking, o está marcado explícitamente como no evaluable con razón.
- Cada estado de cumplimiento está sustentado por evidencia de entrada o marcado como `sin evidencia`; no se inventan credenciales ni hechos.
- El ranking explica las diferencias con los requisitos y marca empates/insuficiencia, sin puntuaciones probabilísticas inventadas.
- No se usan ni reproducen atributos protegidos o PII, y la salida indica que requiere revisión humana.
- Si faltan inputs mínimos, la tarea se detiene con preguntas concretas en vez de generar un ranking.
