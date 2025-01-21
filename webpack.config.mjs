import path from "path";

export default {
  entry: "./main.js",
  output: {
    filename: "bundle.js",
    path: path.resolve("dist"),
    clean: true,
    libraryTarget: "module",
  },
  target: "web",
  optimization: {
    minimize: true,
    concatenateModules: true,
    removeAvailableModules: true,
    splitChunks: false,
    usedExports: true,
    providedExports: true,
  },
  experiments: {
    outputModule: true,
  },
  devtool: false,
  mode: "production",
  module: {
    parser: {
      javascript: {
        exprContextCritical: false,
        importMeta: false,
        node: false,
        browserHash: false,
      },
    },
  },
  performance: {
    hints: false,
  },
};
