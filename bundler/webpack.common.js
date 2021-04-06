const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = {
  entry: {
    app: "./src/index.js",
  },
  devtool: "source-map",
  plugins: [
    // new CopyWebpackPlugin([ { from: path.resolve(__dirname, '../static') } ]),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "../src/index.html"),
      minify: true,
    }),
  ],
  module: {
    rules: [
      // HTML
      {
        test: /\.(html)$/,
        use: ["html-loader"],
      },
      // CSS
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      // JS
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
      // MODELS
      {
        test: /\.(glb|gltf)$/,
        loader: "file-loader",
        include: path.join(__dirname, "../src/assets"),
      },
      // IMAGES
      {
        test: /\.(png|jpe?g|gif)$/,
        loader: "file-loader",
        include: path.join(__dirname, "../src/assets"),
      },
      // Shaders
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ["raw-loader", "glslify-loader"],
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
