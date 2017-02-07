module.exports = {
    entry: {
        app: './src/main.ts'
    },
    output: {
        filename: './build/bundle.js'
    },
     resolve: {
        extensions: ['.webpack.js', '.web.js', '.ts', '.js']
    },
    module: {
        loaders: [
            { test: /\.ts$/, loader: 'awesome-typescript-loader' }
        ]
    }
}