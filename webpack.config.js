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
    minimize: false
  },
  experiments: {
    outputModule: true, 
  },
  devtool: 'inline-source-map',
  mode: "development"
};
