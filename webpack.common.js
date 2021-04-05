const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    app: "./src/index.js",
  },

  plugins: [
    new HtmlWebpackPlugin({
      title: "Production",
      filename: "index.html"
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
      {
        test: /\.(glb|gltf)$/,
        loader: "file-loader",
        include: path.join(__dirname, "src"),
      },
      {
        test: /\.(png|jpe?g|gif)$/,
        loader: "file-loader",
        include: path.join(__dirname, "src"),
      },
    ],
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
    publicPath: "/",
  },
};
