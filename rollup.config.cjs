import * as pkg from './package.json'
import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'

const buildDate = Date()
const banner = `/*
* project  : ${pkg.name}
* version  : ${pkg.version}
* author   : ${pkg.author.name}[${pkg.author.email}]
* license  : ${pkg.license}
* homepage : ${pkg.homepage}
* build    : ${buildDate}
*/`

export default [{
  input: './lib/index.js',
  output: [
    {
      file: './dist/qrcode-encoder.js',
      format: 'umd',
      name: 'QRCode',
      banner: banner,
    },
  ],
  plugins: [
    babel({babelHelpers: 'bundled'}),
  ]
}, {
  input: './lib/index.js',
  output: [
    {
      file: './dist/qrcode-encoder.min.js',
      format: 'umd',
      name: 'QRCode',
    },
  ],
  plugins: [
    terser({
      format: {
        preamble: banner
      }
    }),
  ]
}, {
  input: './lib/main.js',
  output: [
    {
      file: './dist/qrcode-encoder.esm.js',
      format: 'es',
      banner: banner,
    },
  ],
  plugins: [
    babel({babelHelpers: 'bundled'}),
  ]
}, {
  input: './lib/main.js',
  output: [
    {
      file: './dist/qrcode-encoder.node.js',
      format: 'cjs',
      banner: banner,
    },
  ],
  plugins: [
    babel({babelHelpers: 'bundled'}),
  ]
}]
