const { execSync } = require('node:child_process');

try {
  const psCmd = `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Select-Object ProcessId, CommandLine | Format-List`;
  const stdout = execSync(`powershell -NoProfile -Command "${psCmd}"`, { encoding: 'utf-8' });
  console.log(stdout);
} catch (e) {
  console.error(e.message);
}
