import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'qrcode-encoder.js',
      name: 'qrcode-encoder',
      format: 'umd',
      sourcemap: false,
      freeze: false,
    },
  ],
  plugins: [
    typescript({
      useTsconfigDeclarationDir: true,
      abortOnError: false,
      removeComments: false,
      tsconfigOverride: {
        compilerOptions: {
          module: 'ES2020',
        },
      },
    }),
  ],
};
