import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = resolve('public/.htaccess');
const target = resolve('dist/.htaccess');

if (!existsSync(source)) {
  throw new Error('No existe public/.htaccess para el build de produccion.');
}

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log('copied public/.htaccess -> dist/.htaccess');
