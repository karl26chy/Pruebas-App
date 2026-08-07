# Prettier

Guía de configuración para el equipo.

## Qué hace y qué no

Prettier formatea: comillas, sangría, saltos de línea, punto y coma. No revisa código.
ESLint revisa código: variables sin usar, hooks mal escritos, tipos. No formatea.

Los dos conviven. `eslint-config-prettier` apaga las reglas de ESLint que se pisarían con Prettier.

Consecuencia práctica: **no se discute el formato en las revisiones de código**. Lo decide la herramienta.

---

## Parte 1 — Configuración del repositorio

Se hace una sola vez y se sube al repositorio. Si ya está hecha, salta a la Parte 2.

### 1.1 Instalar

```bash
cd client && npm install -D prettier eslint-config-prettier
cd ../api && npm install -D prettier
```

### 1.2 `.prettierrc` en la raíz

```json
{
  "singleQuote": true,
  "semi": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "all",
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

Estos valores no son arbitrarios: reproducen el estilo que ya tiene el código. Cambiarlos genera un diff de miles de líneas.

### 1.3 `.prettierignore` en la raíz

```
node_modules
dist
package-lock.json
api/db.json
*.md
```

### 1.4 Conectar con ESLint

En `client/eslint.config.js`, añadir el import y colocarlo **último** en `extends`:

```js
import prettierConfig from 'eslint-config-prettier';

// ...
extends: [
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  prettierConfig,
],
```

El orden importa: al ir último, desactiva las reglas de formato de todo lo anterior.

### 1.5 Scripts

En `client/package.json` y `api/package.json`:

```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

### 1.6 Versionar los ajustes del editor

`.gitignore` ignora `.vscode/` entero. Hay que dejar pasar dos archivos para que todo el equipo comparta la misma configuración. Reemplazar la línea `.vscode/` por:

```
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
```

### 1.7 `.vscode/settings.json`

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[javascript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[typescriptreact]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[json]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "files.eol": "\n"
}
```

### 1.8 `.vscode/extensions.json`

```json
{
  "recommendations": ["esbenp.prettier-vscode", "dbaeumer.vscode-eslint"]
}
```

Con esto, VS Code recomienda las extensiones al abrir el proyecto.

---

## Parte 2 — Configuración de cada persona

### 2.1 Instalar la extensión

`Ctrl+Shift+X`, buscar **Prettier - Code formatter** (autor: Prettier). Identificador: `esbenp.prettier-vscode`.

Instalar también **ESLint** (`dbaeumer.vscode-eslint`).

### 2.2 Comprobar que funciona

1. Abrir cualquier `.tsx` de `client/src`.
2. Añadir espacios de más en una línea.
3. Guardar con `Ctrl+S`.
4. El archivo debe recolocarse solo.

Si no ocurre nada, ir a la tabla de problemas.

### 2.3 Qué no hacer

- No modificar `.prettierrc`. Es del equipo, no personal.
- No instalar otras extensiones de formato (Beautify, JS-CSS-HTML Formatter). Compiten con Prettier y producen resultados distintos en cada máquina.
- No cambiar los ajustes globales de VS Code para este proyecto. Los del repositorio ya mandan sobre los personales.
- No desactivar `formatOnSave` "porque molesta". Si molesta, es que hay un conflicto que hay que resolver.

---

## Flujo diario

Escribir el código sin preocuparse del formato y guardar. Nada más.

Antes de abrir un pull request:

```bash
npm run format:check
npm run lint
```

Si `format:check` falla:

```bash
npm run format
```

---

## Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| No formatea al guardar | Falta la extensión o hay otro formateador por defecto | Ver la barra inferior de VS Code: debe poner `Prettier`. Si no, `Ctrl+Shift+P` → `Format Document With...` → `Configure Default Formatter` → Prettier |
| Formatea distinto que a un compañero | VS Code usa el Prettier que trae la extensión en vez del del proyecto | Confirmar que `node_modules/prettier` existe: `npm install` |
| El archivo cambia entero al guardarlo | `.prettierrc` no se está leyendo | Debe estar en la raíz del repositorio, no dentro de `client/` |
| ESLint y Prettier se pelean | Falta `eslint-config-prettier` o no está último en `extends` | Revisar el paso 1.4 |
| Todo el archivo aparece modificado en `git diff` | Finales de línea CRLF (Windows) | `git config --global core.autocrlf input` y volver a clonar |
| Prettier toca archivos que no debería | Falta entrada en `.prettierignore` | Añadir la ruta |

Para ver qué está haciendo la extensión: `Ctrl+Shift+U` → desplegable → **Prettier**.

---

## Primera aplicación al código existente

Formatear todo genera un commit enorme que ensucia `git blame`. Se hace así:

```bash
cd client && npm run format
cd ../api && npm run format
git add -A
git commit -m "chore: aplicar formato Prettier"
```

Después, en un archivo `.git-blame-ignore-revs` en la raíz, poner el hash de ese commit:

```
# Aplicación inicial de Prettier
<hash-del-commit>
```

Y activarlo:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

`git blame` pasará por alto ese commit y seguirá mostrando quién escribió cada línea de verdad.

Ese commit debe ir solo: sin mezclar cambios de código. Si se mezcla, la revisión es imposible.
