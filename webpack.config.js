const {
  DefinePlugin,
  HotModuleReplacementPlugin,
  NamedModulesPlugin,
  optimize,
} = require('webpack');
const path = require('path');
const glob = require('glob');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const PurifyCSSPlugin = require('purifycss-webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { clusterPort } = require('./server/config/environment');
const PORT = process.env.PORT || clusterPort;
const PRODUCTION = process.env.NODE_ENV === 'production';
const DEVELOPMENT = process.env.NODE_ENV === 'development';
const LOCAL = process.env.NODE_ENV === 'local';

const plugins = PRODUCTION ?
  [
    new optimize.UglifyJsPlugin(
      {
        sourceMap: true,
        compress: {
          warnings: true,
          'screw_ie8': true,
        },
        beautify: false,
        comments: false,
      }
    ),
    new ExtractTextPlugin('style-[contenthash:10].css'),
    new PurifyCSSPlugin(
      {
        paths: glob.sync(path.join(__dirname, 'udomo/views/**/*.html')),
        minimize: true,
      }
    ),
    new HTMLWebpackPlugin(
      {
        template: './client/views/indexProduction.html',
        filename: './views/index.html',
        minify: {
          minifyURLs: 'String',
          removeComments: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          removeTagWhitespace: true,
          useShortDoctype: true,
          removeAttributeQuotes: true,
          minifyJS: true,
          minifyCSS: true,
          caseSensitive: true,
          collapseWhitespace: true,
        },
      }
    ),
  ] :
  [ new HotModuleReplacementPlugin(), new NamedModulesPlugin() ];

plugins.push(
  /**
   * Use environment variables in the client!
   */
  new DefinePlugin({ LOCAL, DEVELOPMENT, PRODUCTION, PORT }),
  /**
   * Separate external modules
   * in another file.
   */
  new optimize.CommonsChunkPlugin(
    {
      name: 'vendor',
      filename: 'vendor.bundle.js',
    }
  ),
  /**
   * Typescript loader.
   */
  new ForkTsCheckerWebpackPlugin()
);

module.exports = {
  // context: __dirname, // eslint-disable-line
  devtool: LOCAL || DEVELOPMENT ? 'cheap-module-source-map' : '',
  entry: {
    app: './client/js/app.js',
    vendor: [ 'ng-annotations' ],
  },
  plugins,
  resolve: {
    alias: {
      'ng-annotations': `${ process.ROOTDIR }/node_modules/ng-annotations/index.js`,
    },
    unsafeCache: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          tsconfig: './tsconfig.json',
          transpileOnly: true,
        },
      },
      /**
       * Transpile ES6 (ES2015) to ES5 with Babel
       */
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              /**
               * Excellent guide for performance tips
               * https://medium.com/@lcxfs1991/webpack-performance-the-comprehensive-guide-4d382d36253b
               */
              cacheDirectory: './webpack_cache/',
              plugins: [ 'transform-decorators-legacy' ],
              presets: [ 'env', 'stage-2' ],
            },
          },
        ],
        exclude: /node_modules/,
      },
      /**
       * For images, use url-loader
       * If an image is below 10kB then include as data,
       * if not, include as file (file-loader)
       */
      {
        test: /\.(png|jpg|gif|ico)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              cacheDirectory: './webpack_cache/',
              limit: 10000,
              name: 'images/[hash:12].[ext]',
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'sass-loader',
          },
        ],
      },
      /**
       * CSS styles
       */
      {
        test: /\.css$/,
        use: LOCAL || DEVELOPMENT ?
          /**
           * For development use style-loader and css-loader
           */
          [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader',
              options: {
                localIndentName: '[path][name]---[local]',
              },
            },
          ] :
          /**
           * For production use ExtractTextPlugin
           */
          ExtractTextPlugin.extract(
            {
              use: {
                loader: 'css-loader',
                options: {
                  cacheDirectory: './webpack_cache/',
                  minimize: true,
                  localIdentName: '[hash:base64:10]',
                },
              },
            }
          ),
        include: [
          /node_modules\/bootstrap/,
          /node_modules\/alertifyjs/,
          /client\/css/,
        ],
      },
      /**
       * Fonts
       */
      {
        test: /\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)/,
        loader: 'url-loader',
      },
      LOCAL || DEVELOPMENT ? { test: /\.(html)$/, loader: 'raw-loader' } : {},
    ],
  },
  output: {
    path: path.join(__dirname, 'udomo'),
    publicPath: '/',
    filename: PRODUCTION ? 'bundle.[hash:12].min.js' : 'bundle.js',
  },
  devServer: {
    contentBase: './client',
    /**
     * This loads HMR on webpack.
     */
    hot: true,
    /**
     * Limit console messages to errors-only.
     */
    stats: 'errors-only',
    /**
     * Open a new browser tab when initialized
     */
    open: true,
    /**
     * This fix the 'undefined' page open
     */
    openPage: '',
    /**
     * Gzip content
     */
    compress: true,
    /**
     * Redirect all uDomo '/api' calls...
     */
    proxy: {
      '/api': {
        target: {
          host: '0.0.0.0',
          port: PORT,
        },
        secure: false,
      },
    },
  },
};
