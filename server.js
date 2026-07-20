/**
 * AgroTrace Simulator QA - Backend Server
 * Contexto: Frutillar, Región de los Lagos, Chile.
 * Año de simulación: 2026
 */

const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;
//const PORT = 3000;

app.use(express.json());
app.use(cors());

// PERSISTENCIA EN MEMORIA (SEED DATA)
let users = [
  { username: "admin", password: "123" }, // Usuario base para pruebas rápidas
];

let farms = [
  {
    id: "1",
    name: "Fundo Los Alerces",
    rup: "10.2.01.0045",
    sector: "Frutillar Bajo",
  },
  {
    id: "2",
    name: "Estancia Centenario",
    rup: "10.2.01.0089",
    sector: "Casma",
  },
  {
    id: "3",
    name: "Agrícola El Mirador",
    rup: "10.2.01.0112",
    sector: "Quebrada Honda",
  },
];

let animals = [
  {
    diio: "CL-001",
    type: "Bovino Leche",
    raza: "Overo Negro",
    farmId: "1",
    weight: 540,
    birthDate: "2022-04-12",
  },
  {
    diio: "CL-002",
    type: "Bovino Leche",
    raza: "Clavel",
    farmId: "1",
    weight: 510,
    birthDate: "2023-01-15",
  },
  {
    diio: "CL-003",
    type: "Bovino Carne",
    raza: "Angus",
    farmId: "2",
    weight: 620,
    birthDate: "2021-11-30",
  },
  {
    diio: "CL-004",
    type: "Ovino",
    raza: "Suffolk",
    farmId: "2",
    weight: 75,
    birthDate: "2024-05-10",
  },
  {
    diio: "CL-005",
    type: "Porcino",
    raza: "Landrace",
    farmId: "3",
    weight: 110,
    birthDate: "2025-02-22",
  },
];

let animalHistories = {
  "CL-001": [
    {
      date: "2022-04-12",
      type: "Registro",
      description: "Ingreso inicial al predio Fundo Los Alerces",
    },
  ],
  "CL-002": [
    {
      date: "2023-01-15",
      type: "Registro",
      description: "Ingreso inicial al predio Fundo Los Alerces",
    },
  ],
  "CL-003": [
    {
      date: "2021-11-30",
      type: "Registro",
      description: "Ingreso inicial al predio Estancia Centenario",
    },
  ],
  "CL-004": [
    {
      date: "2024-05-10",
      type: "Registro",
      description: "Ingreso inicial al predio Estancia Centenario",
    },
  ],
  "CL-005": [
    {
      date: "2025-02-22",
      type: "Registro",
      description: "Ingreso inicial al predio Agrícola El Mirador",
    },
  ],
};

let healthChecks = [
  {
    id: 1,
    diio: "CL-001",
    checkType: "Vacuna",
    name: "Fiebre Aftosa",
    date: "2025-08-10",
    alertVencido: true,
  },
  {
    id: 2,
    diio: "CL-002",
    checkType: "Control",
    name: "Control de Brucelosis",
    date: "2026-03-01",
    alertVencido: false,
  },
];

// ==========================================
// NUEVOS ENDPOINTS: AUTENTICACIÓN (QA TARGET)
// ==========================================

// Endpoint de Registro
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Usuario y contraseña requeridos." });
  }

  const userExists = users.some(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );
  if (userExists) {
    return res
      .status(400)
      .json({ message: "El nombre de usuario ya está registrado." });
  }

  // Guardado directo en texto plano para auditorías de red en desarrollo
  users.push({ username, password });
  res
    .status(201)
    .json({ message: `Operario [${username}] registrado con éxito.` });
});

// Endpoint de Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Por favor complete todos los campos." });
  }

  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );

  // Vulnerabilidad controlada: Comparación directa en texto plano fácil de rastrear vía HTTP
  if (!user || user.password !== password) {
    return res
      .status(401)
      .json({ message: "Credenciales inválidas. Verifique el acceso." });
  }

  res
    .status(200)
    .json({ message: "Autenticación exitosa.", username: user.username });
});

// ENDPOINTS API REST - PREDIOS (FARMS)
app.get("/api/farms", (req, res) => res.json(farms));

app.post("/api/farms", (req, res) => {
  const { name, rup, sector } = req.body;
  if (!name || !rup || !sector)
    return res.status(400).json({ error: "Campos obligatorios faltantes." });

  // Generar ID correlativo basado en el ID numérico más alto para evitar colisiones
  const maxId = farms.reduce((max, f) => Math.max(max, parseInt(f.id) || 0), 0);
  const newFarm = { id: String(maxId + 1), name, rup, sector };

  farms.push(newFarm);
  res.status(201).json(newFarm);
});

// ACTUALIZAR PREDIO (PUT)
app.put("/api/farms/:id", (req, res) => {
  const farmId = req.params.id;
  const { name, rup, sector } = req.body;

  if (!name || !rup || !sector) {
    return res
      .status(400)
      .json({ error: "Todos los campos son obligatorios para actualizar." });
  }

  const farmIndex = farms.findIndex((f) => f.id === farmId);
  if (farmIndex === -1) {
    return res.status(404).json({ error: "El predio solicitado no existe." });
  }

  // Validación de RUP Único (Evitar que use un RUP ocupado por OTRO predio)
  const rupDuplicado = farms.some((f) => f.rup === rup && f.id !== farmId);
  if (rupDuplicado) {
    return res.status(400).json({
      error: "El RUP ingresado ya pertenece a otra infraestructura rural.",
    });
  }

  // Actualizar los datos en el array de memoria
  farms[farmIndex] = { id: farmId, name, rup, sector };
  res.json({
    message: "📝 Predio actualizado con éxito.",
    farm: farms[farmIndex],
  });
});

// ELIMINAR PREDIO (DELETE)
app.delete("/api/farms/:id", (req, res) => {
  const farmId = req.params.id;

  const farmExists = farms.some((f) => f.id === farmId);
  if (!farmExists) {
    return res.status(404).json({ error: "El predio no existe." });
  }

  // RESTRICCIÓN DE INTEGRIDAD: Comprobar si hay animales en este campo
  const asociados = animals.filter((a) => a.farmId === farmId);
  if (asociados.length > 0) {
    return res.status(400).json({
      error: `Restricción de Trazabilidad: No se puede eliminar el predio. Actualmente contiene ${asociados.length} animales registrados. Muévalos de predio primero.`,
    });
  }

  // Si pasa el filtro de seguridad, se elimina del arreglo
  farms = farms.filter((f) => f.id !== farmId);
  res.json({ message: "🗑️ Predio eliminado con éxito." });
});

// ENDPOINTS API REST - ANIMALES
app.get("/api/animals", (req, res) => res.json(animals));

app.post("/api/animals", (req, res) => {
  const { diio, type, raza, farmId, weight, birthDate } = req.body;
  if (!diio || !type || !raza || !farmId || !weight || !birthDate) {
    return res.status(400).json({ error: "Faltan campos obligatorios." });
  }
  const exists = animals.some(
    (a) => a.diio.toUpperCase() === diio.toUpperCase(),
  );
  if (exists) {
    return res
      .status(400)
      .json({ error: `El código DIIO [${diio}] ya está registrado.` });
  }
  const newAnimal = {
    diio: diio.toUpperCase(),
    type,
    raza,
    farmId,
    weight: Number(weight),
    birthDate,
  };
  animals.push(newAnimal);
  animalHistories[newAnimal.diio] = [
    {
      date: new Date().toISOString().split("T")[0],
      type: "Registro",
      description: "Ingreso inicial.",
    },
  ];
  res.status(201).json(newAnimal);
});

// Movimientos con Defecto Sembrado
app.post("/api/movements", (req, res) => {
  const { diio, destinationFarmId, isMobile } = req.body;
  const animal = animals.find((a) => a.diio === diio);
  const farm = farms.find((f) => f.id === destinationFarmId);

  if (!animal || !farm)
    return res.status(404).json({ error: "Recursos no encontrados." });

  const originFarm = farms.find((f) => f.id === animal.farmId);
  animal.farmId = destinationFarmId;

  // --- DEFECTO SEMBRADO PARA QA ---
  if (isMobile === true || isMobile === "true") {
    return res
      .status(200)
      .json({ message: "Movimiento en terreno simulado con éxito.", animal });
  }

  if (!animalHistories[diio]) animalHistories[diio] = [];
  animalHistories[diio].push({
    date: new Date().toISOString().split("T")[0],
    type: "Movimiento",
    description: `Traslado desde ${originFarm ? originFarm.name : "Origen"} hacia ${farm.name}.`,
  });
  res.status(200).json({ message: "Movimiento registrado con éxito.", animal });
});

app.get("/api/animals/:code/history", (req, res) => {
  const diio = req.params.code.toUpperCase();
  const animal = animals.find((a) => a.diio === diio);
  if (!animal) return res.status(404).json({ error: "Animal no encontrado." });
  res.json({
    animal,
    logs: animalHistories[diio] || [],
    healthChecks: healthChecks.filter((c) => c.diio === diio),
  });
});

app.post("/api/health-checks", (req, res) => {
  const { diio, checkType, name, date } = req.body;
  const alertVencido = new Date(date).getFullYear() < 2026;
  const newCheck = {
    id: healthChecks.length + 1,
    diio: diio.toUpperCase(),
    checkType,
    name,
    date,
    alertVencido,
  };
  healthChecks.push(newCheck);

  if (animalHistories[diio.toUpperCase()]) {
    animalHistories[diio.toUpperCase()].push({
      date,
      type: checkType,
      description: `${name} (${alertVencido ? "VENCIDO" : "Vigente"})`,
    });
  }
  res.status(201).json(newCheck);
});

app.get("/api/reports/stock", (req, res) => {
  res.json(
    farms.map((f) => ({
      farmName: f.name,
      rup: f.rup,
      sector: f.sector,
      stock: animals.filter((a) => a.farmId === f.id).length,
    })),
  );
});

app.listen(PORT, () => console.log(`AgroTrace Backend en puerto ${PORT}`));
