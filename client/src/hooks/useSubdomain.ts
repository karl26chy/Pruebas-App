import { useCallback, useState } from 'react';
import {
  parseSubdomainFromHostname,
  resolveActiveSubdomain,
} from '../lib/subdomain';

const SUBDOMAIN_KEY = 'edu_platform_subdomain';

export function useSubdomain() {
  const [simulatedSubdomain, setSimulatedSubdomainState] = useState<string | null>(null);

  const realSubdomain = parseSubdomainFromHostname(window.location.hostname);

  // El hostname real es la fuente de verdad: si hay subdominio real, siempre manda.
  // localStorage ("edu_platform_subdomain") solo participa en "localhost" plano.
  const activeSubdomain = resolveActiveSubdomain(window.location.hostname, simulatedSubdomain);

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

  return {
    realSubdomain,
    activeSubdomain,
    setSimulatedSubdomain,
    restoreSavedSubdomain,
  };
}
