import path from "path";

export default {
  entry: "./main.js",
  output: {
    filename: "bundle.js",
    path: path.resolve("dist"),
    libraryTarget: "module",
  },
  target: 'web',
  optimization: {
    minimize: false,
    concatenateModules: true,
    removeAvailableModules: false,
    splitChunks: false,
  },
  experiments: {
    outputModule: true,
  },
 
  devtool: 'eval-source-map',
  mode: "development",
  module: {
    parser: {
      javascript: {
        exprContextCritical: false,
        importMeta: false,
        node: false,
        browserHash: false
      }
    }
  }
};