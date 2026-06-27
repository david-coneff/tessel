// build-entry.js — the esbuild entry point for the single-file studio build.
//
// esbuild has no HTML-entry concept and cannot see the CSS that the Vite shell
// (tessel-vs.html) pulls in via <link> tags. This entry reroutes those four
// stylesheets into the JS module graph — in the same cascade order as the shell
// — so esbuild bundles them into one CSS output the build inliner can inline.
// It then loads the real app entry. This is the core dependency-tree change
// (DS-002 / rhiz-Partition modality B): a JS module becomes the single root the
// bundler walks, instead of the HTML shell.
//
// The Vite build is unaffected — it keeps using tessel-vs.html's <link>/<script>
// tags directly and never imports this file.
import './styles/variables.css';
import './styles/base.css';
import './styles/themes.css';
import './styles/tessel-ui.css';
import './main.js';
