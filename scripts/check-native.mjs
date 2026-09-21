import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const forbidden = [/from ['"]next\//, /from ['"]next['"]/, /next\/image/, /next\/navigation/, /@base-ui/, /@shadcn/, /react-dom/, /<div\b/, /<button\b/, /<input\b/, /<form\b/, /<img\b/];
async function files(dir) { const entries=await readdir(dir,{withFileTypes:true}); return (await Promise.all(entries.map(e=>e.isDirectory()?files(join(dir,e.name)):['.ts','.tsx','.js','.jsx'].includes(extname(e.name))?[join(dir,e.name)]:[]))).flat(); }
const targets=(await Promise.all(['app','components','features','types','services'].map(files))).flat();
const failures=[];
for (const file of targets) { const body=await readFile(file,'utf8'); for (const rule of forbidden) if (rule.test(body)) failures.push(`${file}: ${rule}`); }
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Native source audit passed for ${targets.length} files.`);
