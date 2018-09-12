import resolve from "rollup-plugin-node-resolve"
import commonjs from 'rollup-plugin-commonjs'
import { terser } from "rollup-plugin-terser"
import { eslint } from 'rollup-plugin-eslint'

var isProduction = (process.env.NODE_ENV === 'production')
var sourceMap = isProduction ? false : 'inline'

export default {
  entry: 'src/view_dom.js',
  dest: 'dist/view_dom.js',
  format: 'iife',
  sourceMap: sourceMap,
  plugins: [
    eslint({'fix': false}),
    isProduction && terser(),
    resolve(),
    commonjs()
  ]

}