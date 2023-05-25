import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/qrcode-encoder.js',
      format: 'umd',
      name: 'QRCode',
    },
  ],
  plugins: [
    typescript({
      tsconfig: 'tsconfig.dist.json'
    }),
    babel({
      extensions: ['.ts']
    })
  ]
};
