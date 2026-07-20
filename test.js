const { Builder, By, until } = require("selenium-webdriver");

// ⏱️ CONFIGURACIÓN DE VELOCIDAD (en milisegundos)
const TIEMPO_ENTRE_LETRAS = 150; // Tiempo que tarda en presionar cada tecla (simula humano)
const PAUSA_ENTRE_PASOS = 3000; // Pausa de 3 segundos entre cada acción importante

/**
 * Función auxiliar para escribir carácter por carácter de forma lenta
 */
async function escribirLento(elemento, texto) {
  for (const letra of texto) {
    await elemento.sendKeys(letra);
    await new Promise((resolve) => setTimeout(resolve, TIEMPO_ENTRE_LETRAS));
  }
}

async function ejecutarPrueba() {
  let driver = await new Builder().forBrowser("chrome").build();

  // Configura tus datos
  const LOCALHOST_URL = "http://localhost:5500/index.html";
  const usuarioPrueba = "r.gonzalez";
  const clavePrueba = "Frutillar2026";

  try {
    console.log(`🚀 Iniciando Selenium en modo LENTO...`);
    await driver.manage().window().maximize();
    await driver.get(LOCALHOST_URL);

    await driver.sleep(PAUSA_ENTRE_PASOS); // Espera al cargar la página

    // ========================================================
    // 📝 PASO 1: REGISTRO LENTO
    // ========================================================
    console.log("📝 Localizando campos de registro...");
    await driver.wait(until.elementLocated(By.id("reg-username")), 5000);

    let regUserField = await driver.findElement(By.id("reg-username"));
    let regPassField = await driver.findElement(By.id("reg-password"));

    console.log("✍️ Escribiendo usuario de registro lentamente...");
    await escribirLento(regUserField, usuarioPrueba);
    await driver.sleep(1000);

    console.log("✍️ Escribiendo contraseña de registro lentamente...");
    await escribirLento(regPassField, clavePrueba);
    await driver.sleep(PAUSA_ENTRE_PASOS); // Pausa para que veas los datos puestos

    console.log("⚙️ Haciendo clic en 'Crear Operario'...");
    await driver.findElement(By.css("#form-register .btn-submit")).click();

    // Esperar y cerrar la alerta nativa
    await driver.wait(until.alertIsPresent(), 5000);
    let alertaRegistro = await driver.switchTo().alert();
    console.log(`[Alert]: ${await alertaRegistro.getText()}`);
    await driver.sleep(2000); // Pausa para que leas el alert antes de quitarlo
    await alertaRegistro.accept();

    await driver.sleep(PAUSA_ENTRE_PASOS); // Pausa antes de pasar al login

    // ========================================================
    // 🔐 PASO 2: LOGIN LENTO
    // ========================================================
    console.log("🔐 Localizando campos de inicio de sesión...");
    let loginUserField = await driver.findElement(By.id("login-username"));
    let loginPassField = await driver.findElement(By.id("login-password"));

    console.log("✍️ Escribiendo usuario de login lentamente...");
    await escribirLento(loginUserField, usuarioPrueba);
    await driver.sleep(1000);

    console.log("✍️ Escribiendo contraseña de login lentamente...");
    await escribirLento(loginPassField, clavePrueba);
    await driver.sleep(PAUSA_ENTRE_PASOS); // Pausa para validar visualmente

    console.log("💥 Haciendo clic en 'Ingresar al Sistema'...");
    await driver.findElement(By.css("#form-login .btn-submit")).click();

    // ========================================================
    // 📊 PASO 3: VERIFICACIÓN FINAL
    // ========================================================
    await driver.sleep(PAUSA_ENTRE_PASOS); // Pausa para ver la redirección o el LocalStorage

    const estadoSesion = await driver.executeScript(() => {
      return {
        isAuthenticated: localStorage.getItem("isAuthenticated"),
        currentUser: localStorage.getItem("currentUser"),
      };
    });

    console.log("\n📊 --- RESULTADOS DEL LOCALSTORAGE ---");
    console.log(estadoSesion);
    console.log("---------------------------------------\n");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    // Mantener abierto 5 segundos más al final antes de destruir la ventana
    await driver.sleep(5000);
    await driver.quit();
    console.log("🏁 Navegador cerrado.");
  }
}

ejecutarPrueba();
