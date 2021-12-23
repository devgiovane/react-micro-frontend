const path = require('path');
const DotenvPlugin = require('dotenv-webpack');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const envPaths = {
    production: path.resolve('./', `.env.production`),
    development: path.resolve('./', `.env.development`),
};

const defaultConfig = mode => {
    const envPath = envPaths[mode];
    return {
        mode: mode,
        target: mode === 'production' ? 'browserslist' : 'web',
        devtool: mode === 'production' ? 'source-map' : 'eval',
        entry: {
            shared: [ 'react', 'react-dom' ],
            app: {
                import: path.join(__dirname, "src", "index.js"),
                dependOn: 'shared'
            }
        },
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: 'static/js/_[name].[contenthash].bundle.js',
            chunkFilename: 'static/js/_[name].[contenthash].chunk.js',
        },
        devServer: {
            port: 3002,
            hot: true,
            open: true,
            allowedHosts: 'all',
        },
        resolve: {
            extensions: [ '.js', '.jsx', '.json' ],
            alias: { }
        },
        plugins: [
            new DotenvPlugin({
                safe: false,
                path: envPath
            }),
            new ProvidePlugin({
                React: 'react'
            }),
            new HtmlWebpackPlugin({
                hash: true,
                minify: mode === 'production',
                template: path.join(__dirname, "public", "index.html"),
            })
        ],
        experiments: {
            syncWebAssembly: true,
            asyncWebAssembly: true,
        },
        performance: {
            hints: mode === 'production' ? 'warning' : false,
            maxAssetSize: 150 * 1024,
            maxEntrypointSize: 150 * 1024,
        },
        optimization: {
            minimize: mode === 'production',
        },
        module: {
            rules: [
                {
                    test: /.js[x]?$/i,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader'
                    }
                },
                {
                    test: /.css$/i,
                    use: [
                        mode === 'production' ? {
                            loader: MiniCssExtractPlugin.loader
                        } : {
                            loader: 'style-loader'
                        },
                        {
                            loader: 'css-loader',
                            options: {
                                modules: {
                                    auto: path => path.endsWith(".module.css"),
                                    localIdentName: '_[name]__[local]--[hash:base64:10]'
                                }
                            }
                        },
                        {
                            loader: 'postcss-loader'
                        }
                    ]
                },
                {
                    test: /.(woff|woff2|ttf|eot|svg|png|jpg)$/i,
                    use: {
                        loader: 'file-loader',
                        options: {
                            name: "_[name].[hash].[ext]",
                            outputPath: 'static/img'
                        }
                    }
                }
            ]
        }
    }
};

module.exports = ({ mode }) => {
    console.log('Mode', mode);
    let config = defaultConfig(mode);
    if (mode === 'production') {
        config.plugins.push(
            new CleanWebpackPlugin(),
            new MiniCssExtractPlugin({
                filename: 'static/css/_[name].[contenthash].bundle.css',
                chunkFilename: 'static/css/_[name].[contenthash].chunk.css'
            })
        );
        config.optimization = {
            ...config.optimization,
            nodeEnv: mode,
            innerGraph: true,
            moduleIds: 'size',
            chunkIds: 'size',
            mangleExports: 'size',
            mangleWasmImports: true,
            //
            splitChunks: {
                chunks: 'all',
                maxInitialSize: 100 * 1024,
                maxAsyncRequests: Infinity,
                maxInitialRequests: Infinity,
                cacheGroups: {
                    commons: {
                        name: 'commons',
                        chunks: 'initial',
                        minChunks: 2
                    },
                    vendors: {
                        test: /node_modules/,
                        name: 'vendors',
                        chunks: 'all'
                    }
                }
            },
            //
            minimizer: [
                new CssMinimizerPlugin({
                    exclude: /node_modules/,
                    parallel: true,
                }),
                new TerserPlugin({
                    exclude: /node_modules/,
                    parallel: true,
                    extractComments: true,
                    terserOptions: {
                        compress: {
                            drop_console: true,
                        },
                        format: {
                            comments: false
                        }
                    }
                }),
            ],
            removeEmptyChunks: true,
            removeAvailableModules: true
        }
    }
    return config;
}
