// main.js
const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let otimizacaoProcess = null;
let simulacaoProcess = null;

// Detecta se esta em DEV ou BUILD
const isDev = !app.isPackaged;

// Caminho base do backend em DEV:
const backendDevPath = path.join(__dirname, "..", "backend");

// Caminho base do backend no BUILD
const backendProdPath = path.join(process.resourcesPath, "backend");

// Retorna caminho correto conforme o ambiente
function backendPath() {
    return isDev ? backendDevPath : backendProdPath;
}

function startPythonServers() {
    const base = backendPath();

    const otimizacaoExec = isDev
        ? path.join(base, "dist", "otimizacao.exe")    // dev
        : path.join(base, "otimizacao.exe");           // build

    const simulacaoExec = isDev
        ? path.join(base, "dist", "simulacao.exe")     // dev
        : path.join(base, "simulacao.exe");            // build

    console.log("Iniciando backend...");
    console.log("Caminho base:", base);
    console.log("Otimizacao:", otimizacaoExec);
    console.log("Simulacao:", simulacaoExec);

    // Inicia servidor de otimização
    otimizacaoProcess = spawn(otimizacaoExec, [], {
        cwd: base,
        windowsHide: true
    });

    otimizacaoProcess.stdout.on("data", data =>
        console.log("[OTIMIZAÇÃO]", data.toString())
    );
    otimizacaoProcess.stderr.on("data", data =>
        console.error("[OTIMIZAÇÃO ERRO]", data.toString())
    );

    // Inicia servidor de simulação
    simulacaoProcess = spawn(simulacaoExec, [], {
        cwd: base,
        windowsHide: true
    });

    simulacaoProcess.stdout.on("data", data =>
        console.log("[SIMULAÇÃO]", data.toString())
    );
    simulacaoProcess.stderr.on("data", data =>
        console.error("[SIMULAÇÃO ERRO]", data.toString())
    );
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, "../frontend/index.html"));

    // mainWindow.webContents.openDevTools(); // Abre DevTools para analise
}

app.whenReady().then(() => {
    startPythonServers();
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

// Mata os servidores Python quando o Electron fecha
app.on("before-quit", () => {
    console.log("Encerrando servidores Python...");

    try {
        if (otimizacaoProcess) otimizacaoProcess.kill();
        if (simulacaoProcess) simulacaoProcess.kill();
    } catch (e) {
        console.error("Erro ao matar processos:", e);
    }
});
