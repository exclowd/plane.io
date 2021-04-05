const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    app: "./src/index.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Production",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.join(__dirname, "src"),
        exclude: /node_modules/,
        loader: "babel-loader",
      },
      {
        test: /\.(glb|gltf)$/,
        loader: "file-loader",
        include: path.join(__dirname, "src"),
        options: {
          outputPath: "assets/models"
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js",
    clean: true,
    publicPath: "/",
  },
};
