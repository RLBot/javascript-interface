import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

export default defineConfig({
  input: "src/index.ts",
  tsconfig: true,
  plugins: [
    dts({
      tsgo: true,
    }),
  ],
  output: {
    sourcemap: true,
    dir: "dist",
  },
});
