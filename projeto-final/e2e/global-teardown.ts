import fs from 'fs';
import os from 'os';
import path from 'path';

export default function globalTeardown(): void {
  const dataDirectory = process.env.SGOA_DATA_DIR;
  const temporaryDirectoryPrefix = path.join(os.tmpdir(), 'sgoa-e2e-');

  if (!dataDirectory?.startsWith(temporaryDirectoryPrefix)) {
    throw new Error('Refusing to remove a non-isolated Playwright data directory.');
  }

  fs.rmSync(dataDirectory, { recursive: true, force: true });
}
