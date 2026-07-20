import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  // Una carga baja y controlada para probar rendimiento local
  stages: [
    { duration: "30s", target: 5 }, // Sube de 0 a 5 usuarios en 30 segundos
    { duration: "1m", target: 5 }, // Se mantiene con 5 usuarios por 1 minuto
    { duration: "10s", target: 0 }, // Baja a 0 usuarios
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // El test falla si más del 1% de las peticiones da error
    http_req_duration: ["p(95)<500"], // El 95% de las peticiones debe tardar menos de 500ms
  },
};

export default function () {
  // Cambia este puerto por el que use tu proyecto local (ej: 3000, 5000, 8000)
  const BASE_URL = "http://localhost:3000";

  // 1. Probar un endpoint tipo GET (ej: obtener productos o usuarios)
  const resGet = http.get(`${BASE_URL}/api/items`);

  // Validamos que el servidor local responda con un HTTP 200
  check(resGet, {
    "status es 200": (r) => r.status === 200,
  });

  sleep(1); // Espera de 1 segundo entre iteraciones por usuario
}
