import { build } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const projectRoot = path.resolve(__dirname, '..');

try {
  await build({
    root: projectRoot,
    configFile: path.resolve(projectRoot, 'vite.config.js'),
  });
  console.log('Build successful');
} catch (err) {
  console.error('Build failed with errors:');
  if (err.errors) {
    err.errors.forEach((e, i) => {
      console.error(`Error ${i + 1}:`, e);
    });
  } else {
    console.error(err);
  }
  process.exit(1);
}
