'use strict';

/**
 * Vim-like scrolling for VS Code's built-in Markdown preview.
 *
 * This file is loaded in the preview webview through markdown.previewScripts.
 * It intentionally only handles navigation when the preview itself has focus;
 * links, controls, and editable elements keep their normal browser behavior.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory;
    } else if (root && root.document) {
        factory(root, root.document).install();
    }
}(typeof window !== 'undefined' ? window : globalThis, function createVimMotionHandler(win, doc) {
    const scrollElement = doc.scrollingElement || doc.documentElement;
    let pendingPrefix = null;
    let prefixTimer = null;

    function clearPrefix() {
        pendingPrefix = null;
        if (prefixTimer !== null) {
            win.clearTimeout(prefixTimer);
            prefixTimer = null;
        }
    }

    function waitForPrefix(prefix) {
        clearPrefix();
        pendingPrefix = prefix;
        prefixTimer = win.setTimeout(clearPrefix, 500);
    }

    function dimensions() {
        const style = win.getComputedStyle ? win.getComputedStyle(doc.body) : {};
        const fontSize = Number.parseFloat(style.fontSize) || 16;
        const rawLineHeight = Number.parseFloat(style.lineHeight);
        let lineHeight = rawLineHeight;
        if (!Number.isFinite(lineHeight)) {
            lineHeight = fontSize * 1.2;
        } else if (lineHeight <= 3 && !String(style.lineHeight).endsWith('px')) {
            // Unitless CSS line-height values are multipliers of font-size.
            lineHeight *= fontSize;
        }
        const height = win.innerHeight || scrollElement.clientHeight || 1;
        const width = win.innerWidth || scrollElement.clientWidth || 1;
        return {
            lineHeight,
            horizontalStep: Math.max(8, fontSize),
            page: Math.max(lineHeight, height * 0.9),
            halfPage: Math.max(lineHeight, height * 0.5),
            horizontalPage: Math.max(fontSize, width * 0.8),
        };
    }

    function scrollBy(top, left) {
        if (typeof win.scrollBy === 'function') {
            win.scrollBy({ top, left, behavior: 'auto' });
            return;
        }
        scrollElement.scrollTop += top;
        scrollElement.scrollLeft += left;
    }

    function scrollTo(top) {
        if (typeof win.scrollTo === 'function') {
            win.scrollTo({ top, left: scrollElement.scrollLeft, behavior: 'auto' });
            return;
        }
        scrollElement.scrollTop = top;
    }

    function top() {
        scrollTo(0);
    }

    function bottom() {
        const viewportHeight = win.innerHeight || scrollElement.clientHeight || 0;
        const height = Math.max(
            scrollElement.scrollHeight || 0,
            doc.documentElement.scrollHeight || 0,
        );
        scrollTo(Math.max(0, height - viewportHeight));
    }

    function center() {
        const viewportHeight = win.innerHeight || scrollElement.clientHeight || 0;
        const height = Math.max(
            scrollElement.scrollHeight || 0,
            doc.documentElement.scrollHeight || 0,
        );
        scrollTo(Math.max(0, (height - viewportHeight) / 2));
    }

    function nextBlock() {
        const viewportHeight = win.innerHeight || scrollElement.clientHeight || 0;
        scrollBy(Math.max(1, viewportHeight * 0.8), 0);
    }

    function previousBlock() {
        const viewportHeight = win.innerHeight || scrollElement.clientHeight || 0;
        scrollBy(-Math.max(1, viewportHeight * 0.8), 0);
    }

    function isInteractiveTarget(target) {
        for (let element = target; element && element !== doc; element = element.parentElement) {
            const tagName = String(element.tagName || '').toLowerCase();
            if (
                tagName === 'a' ||
                tagName === 'button' ||
                tagName === 'input' ||
                tagName === 'select' ||
                tagName === 'textarea' ||
                element.isContentEditable
            ) {
                return true;
            }
        }
        return false;
    }

    function consume(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    function run(key, metrics) {
        switch (key) {
            case 'j':
                scrollBy(metrics.lineHeight, 0);
                return true;
            case 'k':
                scrollBy(-metrics.lineHeight, 0);
                return true;
            case 'h':
                scrollBy(0, -metrics.horizontalStep);
                return true;
            case 'l':
                scrollBy(0, metrics.horizontalStep);
                return true;
            case 'G':
                bottom();
                return true;
            case 'H':
                top();
                return true;
            case 'M':
                center();
                return true;
            case '}':
                nextBlock();
                return true;
            case '{':
                previousBlock();
                return true;
            case 'L':
                bottom();
                return true;
            case 'zH':
                scrollBy(0, -metrics.horizontalPage);
                return true;
            case 'zL':
                scrollBy(0, metrics.horizontalPage);
                return true;
            case 'zh':
                scrollBy(0, -metrics.horizontalStep);
                return true;
            case 'zl':
                scrollBy(0, metrics.horizontalStep);
                return true;
            case 'zt':
                top();
                return true;
            case 'zb':
                bottom();
                return true;
            case 'zz':
                center();
                return true;
            default:
                return false;
        }
    }

    function handleKeydown(event) {
        if (
            event.defaultPrevented ||
            event.isComposing ||
            event.metaKey ||
            event.altKey ||
            isInteractiveTarget(event.target)
        ) {
            return;
        }

        const key = event.key;
        if (key === 'Escape') {
            clearPrefix();
            return;
        }

        const metrics = dimensions();

        if (event.ctrlKey) {
            const controlMotion = {
                'f': metrics.page,
                'b': -metrics.page,
                'd': metrics.halfPage,
                'u': -metrics.halfPage,
                'e': metrics.lineHeight,
                'y': -metrics.lineHeight,
            };
            if (Object.prototype.hasOwnProperty.call(controlMotion, key)) {
                scrollBy(controlMotion[key], 0);
                clearPrefix();
                consume(event);
            }
            return;
        }

        if (pendingPrefix === 'g') {
            clearPrefix();
            if (key === 'g') {
                top();
                consume(event);
                return;
            }
        } else if (pendingPrefix === 'z') {
            clearPrefix();
            const zMotion = `z${key}`;
            if (run(zMotion, metrics)) {
                consume(event);
                return;
            }
        }

        if (key === 'g' || key === 'z') {
            waitForPrefix(key);
            consume(event);
            return;
        }

        if (run(key, metrics)) {
            clearPrefix();
            consume(event);
        }
    }

    return {
        handleKeydown,
        install() {
            win.addEventListener('keydown', handleKeydown, true);
            return this;
        },
        dispose() {
            clearPrefix();
            win.removeEventListener('keydown', handleKeydown, true);
        },
    };
}));
