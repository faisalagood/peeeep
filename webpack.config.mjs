import path from "path";

export default {
  entry: "./main.js",
  output: {
    filename: "bundle.js",
    path: path.resolve("dist"),
    libraryTarget: "module",
  },
  experiments: {
    outputModule: true,
  },
  devtool: "source-map",
  mode: "development",
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
};