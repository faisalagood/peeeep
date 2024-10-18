const path = require("path");

module.exports = {
  entry: "./main.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname),
    libraryTarget: "module", // Output as an ES module
  },
  experiments: {
    outputModule: true, // Enable ES module output
  },
  // Removed resolve section as it's not needed
  mode: "production",
  devtool: "source-map", 
};