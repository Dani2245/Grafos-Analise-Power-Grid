const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let processosBackends = [];

function getExePath(nomeExe) {
  let exePath;
  
  if (app.isPackaged) {
    exePath = path.join(process.resourcesPath, nomeExe);
  } else {
    exePath = path.join(__dirname, '..', 'backend', 'dist', nomeExe);
  }
  
  console.log('Procurando arquivo em:', exePath);
  
  if (!fs.existsSync(exePath)) {
    console.error(`Arquivo não encontrado: ${exePath}`);
    return null;
  }
  
  console.log(`Arquivo encontrado: ${exePath}`);
  return exePath;
}

function iniciarBackends() {
  const backends = [
    "diagnostico.exe",
    "recomendacoes.exe", 
    "otimizacao.exe"
  ];

  backends.forEach(nomeExe => {
    const caminhoExe = getExePath(nomeExe);
    
    if (!caminhoExe) {
      console.error(`Não foi possível encontrar: ${nomeExe}`);
      return;
    }

    try {
      const processo = spawn(caminhoExe, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(caminhoExe)
      });

      console.log(`Backend iniciado: ${nomeExe} (PID: ${processo.pid})`);

      processo.stdout?.on("data", data =>
        console.log(`[${nomeExe}] ${data.toString()}`)
      );
      processo.stderr?.on("data", data =>
        console.error(`[${nomeExe} ERRO] ${data.toString()}`)
      );

      processosBackends.push(processo);
    } catch (error) {
      console.error(`Falha ao iniciar ${nomeExe}:`, error);
    }
  });
}

function criarJanela() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // **CAMINHO PARA PRODUÇÃO**
  let frontendPath;
  
  if (app.isPackaged) {
    frontendPath = path.join(process.resourcesPath, 'frontend', 'index.html');
  } else {
    // DESENVOLVIMENTO
    frontendPath = path.join(__dirname, '../frontend/index.html');
  }
  
  console.log('Carregando frontend de:', frontendPath);
  console.log('Arquivo existe?', fs.existsSync(frontendPath));
  
  win.loadFile(frontendPath);
}

app.whenReady().then(() => {
  console.log('Iniciando aplicação...');
  console.log('App isPackaged:', app.isPackaged);
  console.log('Resources path:', process.resourcesPath);
  
  iniciarBackends();
  criarJanela();
});

app.on('window-all-closed', () => {
  processosBackends.forEach(p => p.kill());
  if (process.platform !== 'darwin') app.quit();
});