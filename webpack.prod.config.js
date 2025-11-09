const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const CopyPlugin = require("copy-webpack-plugin");
module.exports = [{
    mode: "production",
    entry: {main: './src/index.ts'},
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    },
    output: {
        publicPath: 'auto',
        uniqueName: 'cryptoprovider_fnv1',
        scriptType: 'text/javascript',
        filename: '[name].js',
        clean: true
    },
    optimization: {
        // fix a temporary bug
        runtimeChunk: false
    },
    plugins: [
        new ModuleFederationPlugin({
            name: 'cryptoprovider_fnv1',
            library: { type: 'var', name: '[name]' },
            filename: '[name].js',
            exposes: [{ ICryptoProvider: './src/app/cryptoProviderFnv1Extension.ts' }],
            shared: {
                '@pilotdev/pilot-web-sdk': {
                    singleton: true,
                }
            }
        }),

        new CopyPlugin({
            patterns: [
                { from: "./src/assets/extensions.config.json", to: "extensions.config.json" }
            ],
        }),
    ],
    devServer: {
        port: 4300,
        allowedHosts: 'auto',
        headers: {
            'Access-Control-Allow-Origin': '*',
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT",
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-time-zone-offset"
        },
    },
}]