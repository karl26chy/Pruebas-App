import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const cache = new Map();

export const templates = [
  {
    id: 'default',
    name: 'Formato por defecto',
    htmlPath: 'default/template.html',
    cssPath: 'default/style.css',
  },
];

export function getTemplateById(id) {
  const entry = templates.find(t => t.id === id);
  if (!entry) return null;
  if (!cache.has(id)) {
    const html = fs.readFileSync(path.join(here, entry.htmlPath), 'utf8');
    const css = fs.readFileSync(path.join(here, entry.cssPath), 'utf8');
    cache.set(id, { ...entry, html, css });
  }
  return cache.get(id);
}

export function listTemplates() {
  return templates.map(t => ({ id: t.id, name: t.name }));
}
