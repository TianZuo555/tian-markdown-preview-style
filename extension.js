'use strict';

const mark = require('markdown-it-mark');

function activate() {
    return {
        extendMarkdownIt(markdownIt) {
            return markdownIt.use(mark);
        }
    };
}

module.exports = { activate };
