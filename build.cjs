const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/sample.ts'],
  bundle: true,
  outfile: 'dist/sample.cjs',
  platform: 'node',
  format: 'cjs',
  target: 'node16',
  external: ['node:*'],
  sourcemap: true
}).then(() => {
  console.log('Build complete');
}).catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
}); 