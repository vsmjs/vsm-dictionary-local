/*
This Webpack-config is only used for creating an interactive demo in the browser.

It bundles all modules (in-memory),
starts the webpack development server with live-reload, and
serves a demo webpage that loads both the bundled vsm-dictionary and demo-code.

See also 'demoInBrowser.js'.
*/


const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const src  = path.resolve(__dirname, '../src');
const demo = path.resolve(__dirname, './');


module.exports = () => ({
  mode: 'none',

  devServer: {
    port: 3000,
    open: true
  },

  entry: src + '/DictionaryLocal.js',

  devtool: 'inline-source-map',

  module: {
    rules: [
      {
        test: /\.js$/,
        include: src,
        exclude: /(node_modules|^demo.+\.js)/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                // `esmodules: true` is necessary, as otherwise Babel causes
                // the error "class constructors must be invoked with |new|".
                // So it works only in modern browsers that support ES Modules.
                ['@babel/preset-env', { targets: { esmodules: true } }]
              ]
            }
          }
        ]
      }
    ]
  },

  node: {
    fs: 'empty'
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: demo + '/demo.html',
      inject: false
    }),
    new CopyWebpackPlugin([
      { from: demo + '/demoData.js' },
      { from: demo + '/demoInBrowser.js' }
    ])
  ],

  output: {
    filename: 'bundle.js',  // Used by HtmlWebpackPlugin.
    library: 'VsmDictionaryLocal',  // } => global variable for browsers.
    libraryTarget: 'window'         // }  " .
  }
});
