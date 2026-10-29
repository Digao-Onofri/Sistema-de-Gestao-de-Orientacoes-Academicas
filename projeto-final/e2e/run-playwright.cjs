const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'sgoa-e2e-'));
const playwrightCli = require.resolve('@playwright/test/cli');
const result = spawnSync(
  process.execPath,
  [playwrightCli, 'test', ...process.argv.slice(2)],
  {
    env: { ...process.env, SGOA_DATA_DIR: dataDirectory },
    stdio: 'inherit',
  }
);

fs.rmSync(dataDirectory, { recursive: true, force: true });

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
