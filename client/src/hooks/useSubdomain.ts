import { useCallback, useState } from 'react';

const SUBDOMAIN_KEY = 'edu_platform_subdomain';

/**
 * Deduce la institución activa a partir del host.
 * En localhost o ante una IP no hay subdominio, así que se puede simular.
 */
function parseSubdomain(): string | null {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^(\d+\.){3}\d+$/.test(hostname)) {
    return null;
  }
  const parts = hostname.split('.');
  if (parts.length > 2) {
    // "colegiosanignacio.plataforma.com" -> "colegiosanignacio"
    return parts[0];
  }
  return null;
}

export function useSubdomain() {
  const [simulatedSubdomain, setSimulatedSubdomainState] = useState<string | null>(null);

  const activeSubdomain = parseSubdomain() || simulatedSubdomain;

  const setSimulatedSubdomain = useCallback((subdomain: string | null) => {
    setSimulatedSubdomainState(subdomain);
    if (subdomain) {
      localStorage.setItem(SUBDOMAIN_KEY, subdomain);
    } else {
      localStorage.removeItem(SUBDOMAIN_KEY);
    }
  }, []);

  /** Recupera el subdominio simulado sin volver a escribirlo en localStorage. */
  const restoreSavedSubdomain = useCallback(() => {
    const saved = localStorage.getItem(SUBDOMAIN_KEY);
    if (saved) setSimulatedSubdomainState(saved);
  }, []);

  return { activeSubdomain, setSimulatedSubdomain, restoreSavedSubdomain };
}
