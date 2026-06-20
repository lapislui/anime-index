/* eslint-disable */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runPowerShell(cmd) {
  try {
    return execSync(`powershell -NoProfile -Command "${cmd.replace(/"/g, '\\"')}"`, { encoding: 'utf8' }).trim();
  } catch (_err) {
    return '';
  }
}

console.log('Gathering PC specifications...');

const os = runPowerShell('(Get-CimInstance Win32_OperatingSystem).Caption') || 'Windows';
const manufacturer = runPowerShell('(Get-CimInstance Win32_ComputerSystem).Manufacturer') || 'Unknown';
const model = runPowerShell('(Get-CimInstance Win32_ComputerSystem).Model') || 'Unknown';
const cpuName = runPowerShell('(Get-CimInstance Win32_Processor).Name') || 'Unknown CPU';
const cores = runPowerShell('(Get-CimInstance Win32_Processor).NumberOfCores') || 'Unknown';
const threads = runPowerShell('(Get-CimInstance Win32_Processor).NumberOfLogicalProcessors') || 'Unknown';

// Get GPU Name and VRAM
const gpuRaw = runPowerShell("Get-CimInstance Win32_VideoController | ForEach-Object { $_.Name + '|' + $_.AdapterRAM }") || '';
const gpus = gpuRaw.split('\n').filter(Boolean).map(line => {
  const [name, ramBytes] = line.split('|');
  const ramGb = ramBytes ? Math.round(parseInt(ramBytes, 10) / (1024 * 1024 * 1024)) : 0;
  return { name: name.trim(), vram: ramGb > 0 ? `${ramGb} GB` : 'Unknown' };
});

// Get Total RAM
const ramBytesRaw = runPowerShell("(Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum).Sum") || '';
let totalRam = 'Unknown';
if (ramBytesRaw) {
  totalRam = `${Math.round(parseInt(ramBytesRaw, 10) / (1024 * 1024 * 1024))} GB`;
}

// Get Drives
const drivesRaw = runPowerShell("Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | ForEach-Object { $_.DeviceID + '|' + $_.Size }") || '';
const drives = drivesRaw.split('\n').filter(Boolean).map(line => {
  const [deviceId, sizeBytes] = line.split('|');
  const sizeGb = sizeBytes ? Math.round(parseInt(sizeBytes, 10) / (1024 * 1024 * 1024)) : 0;
  return { id: deviceId.trim(), size: sizeGb > 0 ? `${sizeGb} GB` : 'Unknown' };
});

// DirectX version detection
const dxVersion = 'DirectX 12';

// Build the text report matching parsePcReport regexes
const reportLines = [
  '========================================',
  '         GAMEVERSE PC SPEC REPORT',
  '========================================',
  `Generated: ${new Date().toLocaleString()}`,
  '',
  '=== SYSTEM ===',
  `Manufacturer: ${manufacturer}`,
  `Model: ${model}`,
  '',
  '=== CPU ===',
  `Name: ${cpuName}`,
  `Cores: ${cores}`,
  `Threads: ${threads}`,
  '',
  '=== GPU ==='
];

if (gpus.length > 0) {
  gpus.forEach(gpu => {
    reportLines.push(`GPU Name: ${gpu.name}`);
    reportLines.push(`VRAM: ${gpu.vram}`);
  });
} else {
  reportLines.push('GPU Name: Unknown');
  reportLines.push('VRAM: Unknown');
}

reportLines.push(
  '',
  '=== MEMORY ===',
  `Total RAM: ${totalRam}`,
  '',
  '=== STORAGE ==='
);

if (drives.length > 0) {
  drives.forEach(drive => {
    reportLines.push(`Drive Name: ${drive.id}`);
    reportLines.push(`Size: ${drive.size}`);
  });
} else {
  reportLines.push('Drive Name: C:');
  reportLines.push('Size: Unknown');
}

reportLines.push(
  '',
  '=== WINDOWS ===',
  `OS: ${os}`,
  '',
  '=== DIRECTX ===',
  `DirectX Version: ${dxVersion}`,
  '',
  '========================================',
  'END OF REPORT',
  '========================================'
);

const reportText = reportLines.join('\n');

const outputPath = path.join(__dirname, '..', 'PC_Spec_Report.txt');
fs.writeFileSync(outputPath, reportText, 'utf8');

console.log(`\nReport successfully written to: ${outputPath}\n`);
console.log(reportText);
