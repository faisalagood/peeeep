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
  mode: "development",
  devtool: "source-map", 
};
