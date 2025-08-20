import terser from "@rollup/plugin-terser";

export default {
  input: "src/index.js",
  output: {
    file: "dist/widget.min.js",
    format: "iife",   // Immediately Invoked Function Expression
    name: "MyWidget", // global variable name (optional, since we set window.MyWidget manually)
  },
  plugins: [terser()] // minifies
};
