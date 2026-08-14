/**
 * Resolución del subdominio a partir del hostname. Lógica pura, sin dependencias
 * del navegador, para poder probarla en aislamiento.
 *
 * El hostname real es la fuente de verdad. El subdominio simulado (localStorage)
 * solo participa cuando el host es un portal general: "localhost" o "*.onrender.com".
 */

/**
 * Hosts de portal general de Render: "mi-plataforma.onrender.com" es la URL de la
 * app, no el subdominio de una institución. Nunca se interpreta como tal.
 */
function esHostRender(hostname: string): boolean {
  return hostname === 'onrender.com' || hostname.endsWith('.onrender.com');
}

/**
 * Extrae el subdominio real de un hostname:
 *  - "alegria.localhost"       -> "alegria"
 *  - "alegria.midominio.com"   -> "alegria"
 *  - "localhost" / IP          -> null
 *  - "mi-plataforma.onrender.com" -> null (portal general de Render)
 *  - dominio plano (2 partes)  -> null
 */
export function parseSubdomainFromHostname(hostname: string): string | null {
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    /^(\d+\.){3}\d+$/.test(hostname)
  ) {
    return null;
  }
  // Render: "*.onrender.com" nunca es una institución.
  if (esHostRender(hostname)) {
    return null;
  }
  // Dev local: "alegria.localhost" se lee igual que "alegria.midominio.com"
  if (hostname.endsWith('.localhost')) {
    return hostname.slice(0, -'.localhost'.length) || null;
  }
  const parts = hostname.split('.');
  if (parts.length > 2) {
    // "alegria.midominio.com" -> "alegria"
    return parts[0];
  }
  return null;
}

/** Exactamente "localhost" sin subdominio: único caso donde se admite simulación. */
export function isPlainLocalhost(hostname: string): boolean {
  return hostname === 'localhost';
}

/** Portal general: admite el subdominio simulado de localStorage. */
export function allowsSimulatedSubdomain(hostname: string): boolean {
  return isPlainLocalhost(hostname) || esHostRender(hostname);
}

/**
 * Subdominio activo con prioridad explícita:
 *  - si hay subdominio real, siempre manda (localStorage nunca lo sobreescribe);
 *  - si el host es un portal general ("localhost" plano o "*.onrender.com"),
 *    se permite el subdominio simulado;
 *  - cualquier otro host sin subdominio -> null.
 */
export function resolveActiveSubdomain(hostname: string, simulated: string | null): string | null {
  const real = parseSubdomainFromHostname(hostname);
  if (real !== null) return real;
  return allowsSimulatedSubdomain(hostname) ? simulated : null;
}
