import typescript from "rollup-plugin-typescript2";
import { resolve } from "path";
import { rmdirSync } from "fs";
import dts from "rollup-plugin-dts";
const config = [
  {
    input: "src/index.ts",
    plugins: [
      buildUtil(),
      typescript({
        tsconfigOverride: { compilerOptions: { module: "es2015" } },
      }),
    ],
    output: [
      {
        format: "cjs",
        file: "dist/index.cjs.js",
      },{
        format:"esm",
        file:"dist/index.esm.js"
      }
    ],
  },
  {
    input: "src/index.ts",
    plugins: [dts()],
    output: [{ file: "dist/types.d.ts", format: "es" }]
  }
];
function buildUtil() {
  return {
    name: "build-util",
    buildStart() {
      rmdirSync(resolve(process.cwd(), "dist"), { recursive: true });
    },
  };
}
export default config;
