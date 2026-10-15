# CORE-LYRICS 🎤🔥

> **Estudio profesional de composición, métrica, rimas multisilábicas y flow de rap en tiempo real.**

**CoreLyrics** es una aplicación diseñada para MCs, letristas y productores urbanos. Permite escribir barras y visualizar instantáneamente la complejidad técnica de la letra: análisis fonético en español, detección de familias de rima (multisilábicas, consonantes y asonantes), contador de sílabas poéticas con sinalefa y ley de compensación acentual, timeline rítmico sincronizado con BPM y metrónomo Web Audio.

---

## 🚀 Características Principales

- **Motor Fonético en Tiempo Real (Español)**:
  - Detección precisa de vocales tónicas, diptongos e hiatos.
  - Normalización fonética avanzada: seseo, yeísmo, igualdad b/v, `h` muda y omisión de `u` muda en `que`, `qui`, `gue`, `gui`.
  - Tratamiento adecuado de la `y` como sonido vocálico al final de palabra o en conjunciones.
- **Resaltado In-Place de Familias de Rima**:
  - Resaltado visual en el mismo texto sin desfases de cursor.
  - Paleta cromática de alto contraste (Oro ámbar, Cian neón, Rosa punch, Verde ácido, etc.).
  - Fijación con un clic para iluminar y analizar una familia de rimas específica.
- **Detección de Técnicas Avanzadas de Rap**:
  - **Rimas Multisilábicas**: Coincidencias de 2 a 4+ sílabas en cadencia.
  - **Aliteración**: Detección de patrones percutivos ("tr", "cr", "r", "s", etc.).
  - **Retruécanos & Quiasmos**: Identificación de versos en espejo y esquemas de rima cruzada (`CB ⇄ BC`).
  - **Rimas Internas y Cesuras**: Esquemas compuestos por compás (`AA`, `CB`, `BC`).
- **Métrica Poética & de Rap**:
  - Cálculo de sílabas métricas considerando **sinalefas** entre palabras contiguas.
  - Ajuste automático por acentuación final: Aguda (`+1`), Llana (`0`), Esdrújula (`-1`), Sobresdrújula (`-2`).
- **Timeline Rítmico & Metrónomo Web Audio**:
  - BPM configurable (40 a 240 BPM) con presets de género (BoomBap 85, Clásico 90, Trap 120, Drill 140).
  - Tap tempo interactivo.
  - Carga de pistas instrumentales locales (`.mp3`, `.wav`) con barra de desplazamiento (scrubber) y control de volumen.
  - Pausa y reanudación precisa sin reinicios accidentales.
- **Marcadores de Flow**:
  - Marcadores rítmicos por barra: 4/4 Estándar, Tresillos / Triplet flow, Doble tempo, Pausa / Punchline break y Flow melódico.
- **Buscador & Diccionario de Rimas Integrado**:
  - Vocabulario curado de cientos de términos urbanos, poéticos y de competición.
- **Exportación e Importación**:
  - Letra limpia (`.txt`)
  - Letra con métrica detallada y marcadores (`.txt`)
  - Letras sincronizadas con marcas de tiempo (`.lrc`)
  - Proyecto completo en JSON (`.json`) para copia de seguridad o migración.
  - Importación directa de archivos `.json` al editor.

---

## ⌨️ Atajos de Teclado

| Atajo | Acción |
| :--- | :--- |
| `Ctrl + Espacio` / `Cmd + Espacio` | Reproducir / Pausar Beat y Metrónomo |
| `Ctrl + S` / `Cmd + S` | Guardar proyecto en almacenamiento local |
| `Enter` | Crear nueva barra |
| `Tab` | Insertar sangría de 2 espacios en el editor |
| `Escape` | Cerrar modales y menús desplegables |

---

## 🛠️ Instalación y Uso

### Prerrequisitos
- **Node.js** (v18+ recomendado)
- **npm** o **pnpm**

### Pasos

1. Clonar el repositorio:
   ```bash
   git clone git@github.com:mdwcoder/core-lyrics.git
   cd core-lyrics
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Compilar para producción:
   ```bash
   npm run build
   ```

---

## ☁️ Despliegue en Vercel

El proyecto incluye archivo de configuración [`vercel.json`](vercel.json) optimizado para Vercel:

- **Despliegue independiente**: Importa el repositorio directamente en Vercel. Detectará Vite automáticamente (`Build Command: npm run build`, `Output Directory: dist`).
- **Integrado en otro proyecto desplegado (subruta / monorepo / rewrites)**:
  - Las rutas de los assets compilados son relativas (`base: './'`), lo que permite servirlo en subrutas (ej. `/lyrics`, `/apps/core-lyrics`) sin romper estilos ni scripts.
  - Si tu proyecto principal utiliza rewrites de Next.js o Vercel, puedes enrutar directamente a la compilación o directorio de CoreLyrics.
  - Opcionalmente puedes definir la variable de entorno `VITE_BASE_PATH` (ej. `VITE_BASE_PATH="/lyrics/"`) si tu setup requiere una ruta base absoluta específica.

---

## 📦 Stack Tecnológico

- **React 19**
- **TypeScript**
- **Vite 8**
- **Tailwind CSS v4**
- **Lucide Icons**
- **Web Audio API**

---

## 📄 Licencia

MIT © [mdwcoder](https://github.com/mdwcoder)
