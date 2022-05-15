const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const fse = require('fs-extra');
const chokidar = require('chokidar');
const moment = require('moment');
const chalk = require('chalk');
const editJsonFile = require("edit-json-file");
const ChromeExtensionReloader  = require('webpack-chrome-extension-reloader');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const { camelCase } = require('lodash');

const NodeEnv = process.env.NODE_ENV;
const isDev = () => (NodeEnv === 'development');
const isProd = () => (NodeEnv === 'production');

const TitleName = 'k:wallet';

const cc = {
    mode: 'development',
    devtool: 'nosources-source-map' ,
    watch: true,
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
        filename: t => t.chunk.name + '/index.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new CleanWebpackPlugin(),
        new NodePolyfillPlugin(),
        new CopyFilesOnWatch([
            {from:'./src/icons/', to:'./dist/icons/'},
            {from:'./src/manifest.json', to:'./dist/manifest.json'},
            {from:'./src/_locales/', to:'./dist/_locales/'},
            {from:'./src/images/', to:'./dist/images/'}
        ]),
        new HtmlWebpackPlugin({
            title: TitleName,
            chunks: ['home'],
            filename: 'home/index.html',
            template: 'src/home/index.html'
        }),
        new HtmlWebpackPlugin({
            title: TitleName,
            chunks: ['popup'],
            filename: 'popup/index.html',
            template: 'src/home/index.html'
        })
    ],
    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: 'eslint-loader',
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                ],
            },
            {
                test: /\.(png|svg|jpg|gif|woff|woff2|eot|ttf|otf)$/,
                loader: 'file-loader',
                options:{
                   outputPath: 'home',
                   publicPath: '/home'
                }
            }
        ]
    }
};

if(isDev() === false){
    //production
    delete cc['devtool'];
    cc['mode'] = 'production';
    cc['watch'] = false;
}else{
    //development
    cc['plugins'].push(()=>new ChromeExtensionReloader({
        port: 9090,
        reloadPage: true, 
        entries: { 
            home: 'home',
            popup: 'popup',
            background: 'background',
            scripting: 'scripting'
        }
    }));
}

function CopyFilesOnWatch(options) {
    this.apply = function(compiler){
        if(isDev()){
            options.forEach((v)=>{
                chokidar.watch(v.from).on('change',(path)=>{
                    console.log( chalk.red("Changed:"), chalk.green(path), chalk.yellow(moment().format('LTS')) );
                    fse.copy(path, path.replace('src','dist'));
                });
            });
        }
        compiler.hooks.emit.tapAsync('CopyFilesOnWatch', (compilation, callback) => {
            Promise.all(options.map(v=>fse.copy(v.from,v.to))).then(()=>{
                callback();
            }).catch((err)=>{
                console.error(err);
            })
        });
    };
}



module.exports = cc;