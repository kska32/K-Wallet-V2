const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ChromeExtensionReloader  = require('webpack-chrome-extension-reloader');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const isDev = process.env.NODE_ENV !== 'production';
const TitleName = 'k:wallet';

module.exports = {
    mode: isDev ? 'development' : 'production',
    ...!isDev ? {} : {
        devtool: 'nosources-source-map'
    },
    watch: isDev,
    stats: {
        all: false,
        modules: true,
        errors: true,
        warnings: true,
        moduleTrace: true,
        errorDetails: true
    },
    entry: {
        background: './src/background/index.js',
        home: './src/home/index.js',
        popup: './src/popup/index.js',
        scripting: './src/scripting/index.js'
    },
    output: {
        filename: '[name]/index.js',
        path: path.resolve(__dirname, 'dist'),
        assetModuleFilename: 'assets/[hash][ext][query]'
    },
    plugins: [
        new CleanWebpackPlugin(),
        new NodePolyfillPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {from:'./src/icons', to:'icons'},
                {from:'./src/manifest.json'},
                {from:'./src/_locales', to:'_locales'},
            ],
        }),
        ...
        ['home', 'popup'].map(entryName => 
            new HtmlWebpackPlugin({
                title: TitleName,
                chunks: [entryName],
                filename: `${entryName}/index.html`,
                template: 'src/home/index.html'
            })
        ),
        isDev && (() => new ChromeExtensionReloader({
            port: 9090,
            reloadPage: true, 
            entries: { 
                home: 'home',
                popup: 'popup',
                background: 'background',
                scripting: 'scripting'
            }
        }))
    ].filter(Boolean),
    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.(js|jsx)$/i,
                exclude: /node_modules/,
                loader: 'eslint-loader',
            },
            {
                test: /\.(js|jsx)$/i,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    presets: [
                      ['@babel/preset-env', { targets: "defaults" }],
                      ['@babel/preset-react']
                    ],
                    plugins: [
                        '@babel/plugin-transform-runtime'
                    ]
                }
            },
            {
                test: /\.(sa|sc|c)ss$/i,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            url: {
                                filter: (url, resourcePath) => {
                                    return !url.startsWith('data:application/x-font-ttf');
                                }
                            },
                        } 
                    },
                    {
                        loader: 'sass-loader'
                    }
                ],
            },
            {
                test: /\.(png|svg|jpg|gif|woff|woff2|eot|ttf|otf)$/i,
                type: 'asset'
            }
        ]
    }
};