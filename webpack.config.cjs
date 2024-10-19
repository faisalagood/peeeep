const path = require("path");

module.exports = {
  entry: "./main.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname),
    libraryTarget: "module",
  },
  experiments: {
    outputModule: true, 
  },
  mode: "development",
  devtool: "source-map", 
};