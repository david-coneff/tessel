/**
 * tessel.js — Public API entry point for the Tessel compiler library
 *
 * Browser: script-tag all modules in dependency order, then this file.
 *   window.Tessel is the public API.
 *
 * Node: require('./tessel') — auto-loads all siblings.
 *
 * API:
 *   Tessel.parse(markdownString)     → AST
 *   Tessel.compile(markdownString)   → self-contained HTML string
 *   Tessel.compileAst(ast)           → self-contained HTML string
 *   Tessel.version                   → semver string
 */

(function(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    // Node: require siblings from same directory
    var path = require('path');
    var dir = __dirname;
    var TESSEL_CSS        = require(path.join(dir, 'tessel-css'));
    var TESSEL_RUNTIME_JS = require(path.join(dir, 'tessel-runtime'));
    var TesselParser      = require(path.join(dir, 'tessel-parser'));
    var TesselFields      = require(path.join(dir, 'tessel-fields'));
    var TesselCompiler    = require(path.join(dir, 'tessel-compiler'));
    module.exports = factory(TESSEL_CSS, TESSEL_RUNTIME_JS, TesselParser, TesselFields, TesselCompiler);
  } else {
    // Browser: all globals expected to be in scope
    root.Tessel = factory(
      root.TESSEL_CSS,
      root.TESSEL_RUNTIME_JS,
      root.TesselParser,
      root.TesselFields,
      root.TesselCompiler
    );
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(TESSEL_CSS, TESSEL_RUNTIME_JS, TesselParser, TesselFields, TesselCompiler) {

  var _parser   = new TesselParser();
  var _compiler = new TesselCompiler({ css: TESSEL_CSS, runtime: TESSEL_RUNTIME_JS, fields: TesselFields });

  /**
   * Parse a Tessel Markdown document.
   * @param {string} source — raw markdown with optional front-matter and @directives
   * @returns {object} AST conforming to tessel-schema.json
   */
  function parse(source) {
    return _parser.parse(source);
  }

  /**
   * Compile a Tessel Markdown document to a self-contained HTML string.
   * @param {string} source — raw markdown
   * @returns {string} complete HTML document
   */
  function compile(source) {
    var ast = _parser.parse(source);
    return _compiler.compile(ast);
  }

  /**
   * Compile a pre-parsed AST to HTML.
   * @param {object} ast — result of parse()
   * @returns {string} complete HTML document
   */
  function compileAst(ast) {
    return _compiler.compile(ast);
  }

  return {
    version:    '0.1.0',
    parse:      parse,
    compile:    compile,
    compileAst: compileAst,
    // Expose internals for tooling / Studio
    Parser:    TesselParser,
    Compiler:  TesselCompiler,
    Fields:    TesselFields
  };
});
