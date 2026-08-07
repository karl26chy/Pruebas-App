import { http } from '../http';

/**
 * Fábrica de clientes CRUD: el API expone el mismo contrato para todos los
 * recursos, así que cada uno se declara en una línea.
 */
export function createResourceApi<T>(resource: string) {
  return {
    list: () => http.get<T[]>(`/${resource}`),
    get: (id: string) => http.get<T>(`/${resource}/${id}`),
    create: (data: Partial<T>) => http.post<T>(`/${resource}`, data),
    update: (id: string, data: Partial<T>) => http.put<T>(`/${resource}/${id}`, data),
    patch: (id: string, data: Partial<T>) => http.patch<T>(`/${resource}/${id}`, data),
    remove: (id: string) => http.delete<T>(`/${resource}/${id}`),
  };
}
