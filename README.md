# Encuesta Innovación Pedagógica 2026

Encuesta de evaluación del proceso de formación en IA del Colegio María Montessori (Arica): capacitación inicial con CENTCAP, comunidades de aprendizaje con tutores IA y acompañamiento al aula. 20 preguntas.

## Páginas

| Página | Para quién | Qué hace |
|---|---|---|
| `index.html` | Docentes | Escriben su nombre y responden la encuesta. Las respuestas se envían a la planilla del colegio. |
| `index.html` → **Área UTP** (pie de página) | Solo UTP (requiere clave) | Resultados consolidados por pregunta, respuestas abiertas, detalle por docente y exportación CSV. |

## Datos y privacidad

Este repositorio es público y **no contiene datos ni claves**. Las respuestas se guardan solo en Google Sheets, en la cuenta del colegio, a través de Google Apps Script. La clave UTP se verifica en el servidor.

La conexión se configura en `assets/config.js` (`API_URL`). Las instrucciones completas están en `INSTALACION-ENCUESTA.md`, en la carpeta del proyecto.

## Estructura

```
index.html        Encuesta y Área UTP
assets/app.js     Preguntas, envío y resultados (editar aquí las preguntas)
assets/config.js  URL del servicio de Apps Script
assets/logo.jpg   Logo del colegio
```
