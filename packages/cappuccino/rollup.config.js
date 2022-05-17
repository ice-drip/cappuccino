import typescript from "rollup-plugin-typescript2";
import { resolve } from "path";
import { rmdirSync } from "fs";

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
