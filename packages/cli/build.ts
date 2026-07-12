import pkg from "./package.json" assert { type: "json" };
const externalDeps = Object.keys(pkg.dependencies || {});
const result = await Bun.build({
  entrypoints: ["src/index.tsx"],
  outdir: "dist",
  target: "bun",
  external: externalDeps,
});
if (!result.success) {
  console.error("Build failed");
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}
console.log("Build succeeded!");
