/**
 * AgroTrace Simulator QA - Frontend Logic (Versión Completa, Unificada y Corregida)
 */

const API_URL = "http://localhost:3000/api";
let currentRole = "administrador";

const razasPorEspecie = {
  "Bovino Leche": ["Overo Negro", "Clavel", "Holando Chileno"],
  "Bovino Carne": ["Angus", "Hereford", "Charolais"],
  Ovino: ["Suffolk", "Down", "Corriedale"],
  Porcino: ["Landrace", "Duroc", "Large White"],
};

// ==========================================
// GUARDIÁN DE AUTENTICACIÓN (QA BYPASS TARGET)
// ==========================================
if (localStorage.getItem("isAuthenticated") !== "true") {
  // Si no está logueado, interrumpe el script y patea al login.html
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  // Doble verificación preventiva al montar el DOM
  if (localStorage.getItem("isAuthenticated") !== "true") return;

  injectLogoutButton(); // Inyecta el botón para limpiar sesión fácilmente en testing
  updateRazas();
  initApp();
});

function initApp() {
  loadFarms();
  loadAnimals();
  loadReports();
  generateNextDiio();
}

// FUNCIÓN AUXILIAR PARA HACER LOGOUT MANUAL AL TESTEAR
function injectLogoutButton() {
  const header = document.querySelector("header");
  if (header) {
    const logoutBtn = document.createElement("button");
    logoutBtn.innerText = "🚪 Salir";
    logoutBtn.style =
      "padding: 0.4rem 1rem; background: var(--danger); color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-left: 15px; font-size: 0.85rem;";
    logoutBtn.onclick = () => {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("currentUser");
      window.location.href = "login.html";
    };
    header.appendChild(logoutBtn);
  }
}

// NAVEGACIÓN COMPATIBLE CON LAS IDs DEL HTML
function switchView(viewId, buttonElement) {
  // Ocultar todos los paneles
  document.querySelectorAll(".view-panel").forEach((panel) => {
    panel.classList.remove("active");
    panel.style.display = "none";
  });

  // Quitar estados activos de los botones del menú lateral
  document
    .querySelectorAll(".menu-btn")
    .forEach((btn) => btn.classList.remove("active"));

  // Mostrar el panel seleccionado
  const targetPanel = document.getElementById(viewId);
  if (targetPanel) {
    targetPanel.classList.add("active");
    targetPanel.style.display = "block";
  }

  if (buttonElement) {
    buttonElement.classList.add("active");
  }

  const titles = {
    "view-predios": "📍 Control de Infraestructura Rural (Predios)",
    "view-animales": "🐄 Alta de Identificación Animal (DIIO)",
    "view-movimientos": "🚚 Gestión de Guías de Movimiento y Despacho",
    "view-salud": "💉 Historial Médico y Control Sanitario",
    "view-trazabilidad": "🔍 Auditoría Centralizada de Trazabilidad",
    "view-reportes": "📊 Cuadro Estadístico de Existencias Ganaderas",
  };

  const pageTitle = document.getElementById("page-title");
  if (pageTitle && titles[viewId]) {
    pageTitle.innerText = titles[viewId];
  }
}

// GESTIÓN DE MATRIZ DE ROLES DE ACCESO (QA TESTING)
function setRole(role, element) {
  currentRole = role;
  document
    .querySelectorAll(".role-btn")
    .forEach((btn) => btn.classList.remove("active"));
  if (element) element.classList.add("active");

  const btnAddFarm = document.getElementById("btn-add-farm");
  const btnAddAnimal = document.getElementById("btn-add-animal");
  const btnMove = document.getElementById("btn-move");
  const btnAddHealth = document.getElementById("btn-add-health");

  [btnAddFarm, btnAddAnimal, btnMove, btnAddHealth].forEach((b) => {
    if (b) b.disabled = false;
  });

  if (role === "operador") {
    if (btnAddFarm) btnAddFarm.disabled = true;
    if (btnAddHealth) btnAddHealth.disabled = true;
  } else if (role === "veterinario") {
    if (btnAddFarm) btnAddFarm.disabled = true;
  }
  console.log(`[ROL]: Cambiado a ${role.toUpperCase()}`);
}

// ACTUALIZACIÓN DINÁMICA DE RAZAS SEGÚN LA ESPECIE
function updateRazas() {
  const typeSelect = document.getElementById("ani-type");
  const razaSelect = document.getElementById("ani-raza");
  if (!typeSelect || !razaSelect) return;

  const selectedType = typeSelect.value;
  razaSelect.innerHTML = "";
  razasPorEspecie[selectedType].forEach((raza) => {
    let opt = document.createElement("option");
    opt.value = raza;
    opt.innerText = raza;
    razaSelect.appendChild(opt);
  });
}

// GENERADOR AUTOMÁTICO Y AUTO-INCREMENTAL DE DIIO
async function generateNextDiio() {
  const diioInput = document.getElementById("ani-diio");
  if (!diioInput) return;

  try {
    const res = await fetch(`${API_URL}/animals`);
    const data = await res.json();

    let nextNumber = 1;

    if (data && data.length > 0) {
      // Extraer los números de los DIIO existentes (ej: de "CL-005" toma el 5)
      const numeraciones = data.map((ani) => {
        const match = ani.diio.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      });

      // Buscar el número más alto registrado y sumarle 1
      const maxNumero = Math.max(...numeraciones);
      nextNumber = maxNumero + 1;
    }

    // Formatear el número con ceros a la izquierda (Ej: CL-001, CL-012)
    const formattedNumber = String(nextNumber).padStart(3, "0");
    diioInput.value = `CL-${formattedNumber}`;
  } catch (err) {
    console.error("Error al calcular el correlativo DIIO:", err);
    diioInput.value = `CL-${Math.floor(100 + Math.random() * 900)}`;
  }
}

// CARGA SEGURA DE PREDIOS CON ACCIONES DE EDICIÓN Y ELIMINACIÓN (CORREGIDA)
async function loadFarms() {
  try {
    const res = await fetch(`${API_URL}/farms`);
    const data = await res.json();

    const tbody = document.querySelector("#table-farms tbody");
    const aniFarmSelect = document.getElementById("ani-farm");
    const movFarmSelect = document.getElementById("mov-farm-dest");

    if (tbody) tbody.innerHTML = "";
    if (aniFarmSelect) aniFarmSelect.innerHTML = "";
    if (movFarmSelect) movFarmSelect.innerHTML = "";

    if (!data || data.length === 0) {
      if (aniFarmSelect)
        aniFarmSelect.innerHTML = `<option value="">-- Registre un predio primero --</option>`;
      if (movFarmSelect)
        movFarmSelect.innerHTML = `<option value="">-- Registre un predio primero --</option>`;
      return;
    }

    data.forEach((farm) => {
      if (tbody) {
        // Creamos la fila y celdas mediante DOM nativo para evitar inyecciones HTML defectuosas
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${farm.id}</td>
          <td>${farm.name}</td>
          <td>${farm.rup}</td>
          <td>${farm.sector}</td>
          <td></td>
        `;

        // Botón de Editar mapeado con clausuras seguras
        const btnEdit = document.createElement("button");
        btnEdit.innerText = "✏️ Editar";
        btnEdit.style =
          "padding: 3px 8px; background: #f57c00; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem; margin-right:5px;";
        btnEdit.onclick = () =>
          editFarm(farm.id, farm.name, farm.rup, farm.sector);

        // Botón de Eliminar mapeado de manera limpia
        const btnDelete = document.createElement("button");
        btnDelete.innerText = "🗑️ Borrar";
        btnDelete.style =
          "padding: 3px 8px; background: #d32f2f; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem;";
        btnDelete.onclick = () => deleteFarm(farm.id);

        // Adjuntar botones a la última celda
        const actionTd = tr.querySelector("td:last-child");
        actionTd.appendChild(btnEdit);
        actionTd.appendChild(btnDelete);

        tbody.appendChild(tr);
      }

      if (aniFarmSelect)
        aniFarmSelect.innerHTML += `<option value="${farm.id}">${farm.name}</option>`;
      if (movFarmSelect)
        movFarmSelect.innerHTML += `<option value="${farm.id}">${farm.name}</option>`;
    });
  } catch (err) {
    console.error("Error al conectar con backend al cargar predios:", err);
  }
}

async function loadAnimals() {
  try {
    const res = await fetch(`${API_URL}/animals`);
    const data = await res.json();

    const movDiioSelect = document.getElementById("mov-diio");
    const healthDiioSelect = document.getElementById("health-diio");

    if (movDiioSelect) movDiioSelect.innerHTML = "";
    if (healthDiioSelect) healthDiioSelect.innerHTML = "";

    if (!data || data.length === 0) {
      if (movDiioSelect)
        movDiioSelect.innerHTML = `<option value="">-- Registre un animal primero --</option>`;
      if (healthDiioSelect)
        healthDiioSelect.innerHTML = `<option value="">-- Registre un animal primero --</option>`;
      return;
    }

    data.forEach((ani) => {
      let opt = `<option value="${ani.diio}">${ani.diio} [${ani.raza}]</option>`;
      if (movDiioSelect) movDiioSelect.innerHTML += opt;
      if (healthDiioSelect) healthDiioSelect.innerHTML += opt;
    });
  } catch (err) {
    console.error("Error al conectar con backend al cargar animales:", err);
  }
}

async function loadReports() {
  try {
    const res = await fetch(`${API_URL}/reports/stock`);
    const data = await res.json();
    const tbody = document.querySelector("#table-reports tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach((r) => {
      tbody.innerHTML += `<tr><td>${r.farmName}</td><td>${r.rup}</td><td>${r.sector}</td><td><strong>${r.stock}</strong> cabezas</td></tr>`;
    });
  } catch (err) {
    console.log("No se pudieron actualizar los reportes remotos.");
  }
}

// PROCESAMIENTO GLOBAL DE ENVÍO DE FORMULARIOS (EVITA PUNTOS SORDOS DE CACHÉ)
document.addEventListener("submit", async (e) => {
  if (!e.target) return;

  // 1. REGISTRO DE PREDIOS
  if (e.target.id === "form-farm") {
    e.preventDefault();
    const payload = {
      name: document.getElementById("farm-name").value,
      rup: document.getElementById("farm-rup").value,
      sector: document.getElementById("farm-sector").value,
    };

    try {
      const res = await fetch(`${API_URL}/farms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("📍 Predio Rural guardado con éxito.");
        e.target.reset();
        initApp();
      } else {
        const errData = await res.json();
        alert(`Error del servidor: ${errData.error}`);
      }
    } catch (err) {
      alert("Error de red: Asegúrate de que tu backend Node esté encendido.");
    }
  }

  // 2. ALTA DE ANIMALES
  if (e.target.id === "form-animal") {
    e.preventDefault();
    const farmId = document.getElementById("ani-farm").value;
    if (!farmId)
      return alert("Debe seleccionar o registrar un predio primero.");

    const payload = {
      diio: document.getElementById("ani-diio").value,
      type: document.getElementById("ani-type").value,
      raza: document.getElementById("ani-raza").value,
      farmId: farmId,
      weight: document.getElementById("ani-weight").value,
      birthDate: document.getElementById("ani-birth").value,
    };

    try {
      const res = await fetch(`${API_URL}/animals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        alert("🐄 Control de Identificación Exitoso.");
        e.target.reset();
        initApp();
      } else {
        alert(`ALERTA DE SEGURIDAD / DUPLICIDAD: ${result.error}`);
      }
    } catch (err) {
      alert("Error al intentar comunicar el alta al servidor.");
    }
  }

  // 3. DESPACHO DE TRASLADOS
  if (e.target.id === "form-movement") {
    e.preventDefault();
    const diio = document.getElementById("mov-diio").value;
    const dest = document.getElementById("mov-farm-dest").value;

    if (!diio || !dest)
      return alert("Verifique que existan animales y predios creados.");

    const payload = {
      diio: diio,
      destinationFarmId: dest,
      isMobile: document.getElementById("mov-is-mobile").checked,
    };

    try {
      const res = await fetch(`${API_URL}/movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      alert(result.message || "Movimiento procesado.");
      initApp();
    } catch (err) {
      alert("Error de red al despachar el camión.");
    }
  }

  // 4. REGISTRO CLÍNICO SANITARIO
  if (e.target.id === "form-health") {
    e.preventDefault();
    const diio = document.getElementById("health-diio").value;
    if (!diio) return alert("Seleccione un animal válido.");

    const payload = {
      diio: diio,
      checkType: document.getElementById("health-type").value,
      name: document.getElementById("health-name").value,
      date: document.getElementById("health-date").value,
    };

    try {
      await fetch(`${API_URL}/health-checks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      alert("💉 Registro clínico anexado a la hoja de vida.");
      e.target.reset();
      initApp();
    } catch (err) {
      alert("Error al guardar la bitácora veterinaria.");
    }
  }
});

// FUNCIÓN PARA ELIMINAR PREDIO
async function deleteFarm(id) {
  if (currentRole === "operador") {
    return alert(
      "⛔ ACCESO DENEGADO: Tu rol de Operador no tiene permisos para eliminar infraestructura.",
    );
  }

  if (
    !confirm(
      "⚠️ ¿Está seguro de eliminar este predio? Esta acción podría afectar a los animales asociados.",
    )
  )
    return;

  try {
    const res = await fetch(`${API_URL}/farms/${String(id)}`, {
      method: "DELETE",
    });

    if (res.ok) {
      alert("🗑️ Predio eliminado con éxito.");
      initApp();
    } else {
      const errData = await res.json().catch(() => ({}));
      alert(
        `No se pudo eliminar: ${errData.error || "Restricción de base de datos"}`,
      );
    }
  } catch (err) {
    alert("Error de red al intentar eliminar el predio.");
  }
}

// FUNCIÓN PARA EDITAR PREDIO VIA PROMPT (ROBUSTA)
async function editFarm(id, currentName, currentRup, currentSector) {
  if (currentRole === "operador" || currentRole === "veterinario") {
    return alert(
      "⛔ ACCESO DENEGADO: Tu rol actual no permite modificar datos de infraestructura rural.",
    );
  }

  const newName = prompt("Modificar nombre del Fundo / Estancia:", currentName);
  if (newName === null) return;
  if (!newName.trim()) return alert("El nombre no puede quedar vacío.");

  const newRup = prompt("Modificar RUP (Código SAG):", currentRup);
  if (newRup === null) return;
  if (!newRup.trim()) return alert("El RUP es obligatorio.");

  const newSector = prompt(
    "Modificar Sector (Frutillar Bajo / Frutillar Alto / Casma / Quebrada Honda):",
    currentSector,
  );
  if (newSector === null) return;

  const payload = {
    name: newName.trim(),
    rup: newRup.trim(),
    sector: newSector.trim(),
  };

  try {
    const farmId = String(id); // Normalización del ID para compatibilidad REST completa

    const res = await fetch(`${API_URL}/farms/${farmId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("📝 Predio actualizado con éxito.");
      initApp();
    } else {
      const errData = await res.json().catch(() => ({}));
      console.error("Detalle del error devuelto por el Backend:", errData);
      alert(
        `Error al actualizar: ${errData.error || "Verifica el controlador PUT en tu servidor Node"}`,
      );
    }
  } catch (err) {
    console.error("Error crítico de comunicación de red:", err);
    alert("Error de red al intentar actualizar el predio.");
  }
}

// BUSCADOR CENTRALIZADO DE TRAZABILIDAD (AUDITORÍA)
async function searchAnimal() {
  const code = document.getElementById("search-diio").value.trim();
  if (!code) return alert("Por favor inserte un código de arete válido.");

  try {
    const res = await fetch(`${API_URL}/animals/${code}/history`);
    if (!res.ok) {
      document.getElementById("ficha-resultado").style.display = "none";
      return alert("El DIIO ingresado no existe.");
    }

    const data = await res.json();
    document.getElementById("ficha-resultado").style.display = "block";
    document.getElementById("view-diio").innerText = data.animal.diio;
    document.getElementById("view-type-raza").innerText =
      `${data.animal.type} (${data.animal.raza})`;
    document.getElementById("view-weight").innerText = data.animal.weight;
    document.getElementById("view-farm-actual").innerText =
      `Predio ID: ${data.animal.farmId}`;

    const alertDiv = document.getElementById("view-alerts");
    if (alertDiv) {
      alertDiv.innerHTML = data.healthChecks.some((c) => c.alertVencido)
        ? `<span class="badge alert">⚠️ CRÍTICO: Tratamientos médicos vencidos (Previo a 2026).</span>`
        : `<span class="badge ok">✓ Estado Sanitario Regularizado</span>`;
    }

    const historyDiv = document.getElementById("view-history-logs");
    if (historyDiv) {
      historyDiv.innerHTML = "";
      data.logs.forEach((log) => {
        historyDiv.innerHTML += `<div class="history-item"><strong>[${log.date}] - ${log.type}:</strong> ${log.description}</div>`;
      });
    }
  } catch (err) {
    alert("Error al consultar el módulo de auditoría centralizado.");
  }
}

// ========================================================
// 📊 MÓDULO EXPORTADOR: GENERACIÓN DE EXCEL Y PDF (QA)
// ========================================================

/**
 * 🟢 GENERAR EXCEL: Cuadro Estadístico de Existencias Ganaderas
 * Consulta directamente el endpoint de stock para compilar el libro Excel
 */
async function exportarStockExcel() {
  try {
    console.log("📊 Preparando reporte Excel de existencias ganaderas...");
    const res = await fetch(`${API_URL}/reports/stock`);
    const data = await res.json();

    if (!data || data.length === 0) {
      return alert("⚠️ No hay datos de existencias para exportar.");
    }

    // Mapeamos los datos para que tengan títulos limpios en las columnas del Excel
    const datosFormateados = data.map((item) => ({
      "Fundo / Estancia": item.farmName,
      "RUP (Código SAG)": item.rup,
      "Sector Geográfico": item.sector,
      "Stock de Ganado (Cabezas)": item.stock,
    }));

    // Crear libro de trabajo (Workbook) y hoja (Worksheet)
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosFormateados);

    // Añadir la hoja al libro con un nombre representativo
    XLSX.utils.book_append_sheet(wb, ws, "Existencias Ganaderas");

    // Forzar descarga del archivo compilado
    XLSX.writeFile(wb, `AgroTrace_Existencias_${Date.now()}.xlsx`);
    console.log("✅ Archivo Excel generado y descargado con éxito.");
  } catch (err) {
    console.error("Error al generar el Excel:", err);
    alert("❌ Error de red al compilar el reporte Excel.");
  }
}

/**
 * 🔴 GENERAR PDF: Cuadro Estadístico de Existencias Ganaderas
 * Genera un documento corporativo formal con una tabla auto-ajustable
 */
async function exportarStockPDF() {
  try {
    console.log("📄 Preparando documento PDF institucional...");
    const res = await fetch(`${API_URL}/reports/stock`);
    const data = await res.json();

    if (!data || data.length === 0) {
      return alert("⚠️ No hay datos de existencias para exportar.");
    }

    // Instanciar jsPDF (Formato estándar: mm, hoja A4)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    // --- DISEÑO DE ENCABEZADO ---
    doc.setFillColor(27, 77, 62); // Color institucional AgroTrace (--primary: #1b4d3e)
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("AGROTRACE SIMULATOR QA - PORTAL FRUTILLAR", 14, 14);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Reporte de Control Operativo e Infraestructura Rural`, 14, 22);
    doc.text(`Fecha Emisión: ${new Date().toLocaleDateString()}`, 150, 22);

    // --- TÍTULO INTERNO ---
    doc.setTextColor(33, 37, 41); // --text
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CUADRO ESTADÍSTICO DE EXISTENCIAS GANADERAS", 14, 42);

    // --- CONSTRUCCIÓN DE LA TABLA (autoTable) ---
    const columnas = [
      "Fundo / Estancia",
      "RUP (Código SAG)",
      "Sector Geográfico",
      "Existencia Total",
    ];
    const filas = data.map((item) => [
      item.farmName,
      item.rup,
      item.sector,
      `${item.stock} cabezas`,
    ]);

    doc.autoTable({
      head: [columnas],
      body: filas,
      startY: 48,
      theme: "striped",
      headStyles: {
        fillColor: [17, 51, 40],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      }, // --primary-dark
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        3: { fontStyle: "bold", halign: "right" }, // Alinear a la derecha las existencias numéricas
      },
      didDrawPage: function (data) {
        // Pie de página instructivo
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          "Documento emitido con fines de auditoría interna y QA. AgroTrace Software.",
          14,
          doc.internal.pageSize.height - 10,
        );
      },
    });

    // Guardar/Descargar el PDF
    doc.save(`AgroTrace_Existencias_${Date.now()}.pdf`);
    console.log("✅ Archivo PDF generado y guardado.");
  } catch (err) {
    console.error("Error al generar el PDF:", err);
    alert("❌ Error de red al compilar el reporte PDF.");
  }
}
