"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const createVimMotionHandler = require("../vim-motions.js");

function createHarness() {
    const calls = [];
    const document = {
        body: { tagName: "BODY", parentElement: null },
        documentElement: { scrollHeight: 2400, clientHeight: 800 },
        scrollingElement: { scrollTop: 100, scrollLeft: 50, scrollHeight: 2400, clientHeight: 800 },
    };
    const window = {
        innerHeight: 800,
        innerWidth: 1200,
        clearTimeout() {},
        setTimeout() { return 1; },
        getComputedStyle() {
            return { fontSize: "16px", lineHeight: "25.6px" };
        },
        scrollBy(options) {
            calls.push({ type: "by", ...options });
            document.scrollingElement.scrollTop += options.top;
            document.scrollingElement.scrollLeft += options.left;
        },
        scrollTo(options) {
            calls.push({ type: "to", ...options });
            document.scrollingElement.scrollTop = options.top;
        },
    };
    return { calls, document, window };
}

function key(handler, key, modifiers = {}) {
    const event = {
        key,
        target: { tagName: "BODY", parentElement: null },
        defaultPrevented: false,
        isComposing: false,
        metaKey: false,
        altKey: false,
        ctrlKey: false,
        preventDefault() {
            this.prevented = true;
        },
        stopPropagation() {
            this.stopped = true;
        },
        ...modifiers,
    };
    handler.handleKeydown(event);
    return event;
}

test("j and k scroll one line", () => {
    const harness = createHarness();
    const handler = createVimMotionHandler(harness.window, harness.document);

    key(handler, "j");
    key(handler, "k");

    assert.deepEqual(harness.calls.map(({ type, top }) => ({ type, top })), [
        { type: "by", top: 25.6 },
        { type: "by", top: -25.6 },
    ]);
});

test("gg goes to the top and G goes to the bottom", () => {
    const harness = createHarness();
    const handler = createVimMotionHandler(harness.window, harness.document);

    const firstG = key(handler, "g");
    const secondG = key(handler, "g");
    key(handler, "G");

    assert.equal(firstG.prevented, true);
    assert.equal(secondG.prevented, true);
    assert.deepEqual(harness.calls.map(({ type, top }) => ({ type, top })), [
        { type: "to", top: 0 },
        { type: "to", top: 1600 },
    ]);
});

test("z motions scroll horizontally and vertically", () => {
    const harness = createHarness();
    const handler = createVimMotionHandler(harness.window, harness.document);

    key(handler, "z");
    key(handler, "l");
    key(handler, "z");
    key(handler, "t");
    key(handler, "z");
    key(handler, "z");

    assert.deepEqual(harness.calls.map(({ type, top, left }) => ({ type, top, left })), [
        { type: "by", top: 0, left: 16 },
        { type: "to", top: 0, left: 66 },
        { type: "to", top: 800, left: 66 },
    ]);
});

test("ctrl-e, ctrl-y, ctrl-d, ctrl-u, ctrl-f, and ctrl-b use Vim motions", () => {
    const harness = createHarness();
    const handler = createVimMotionHandler(harness.window, harness.document);

    key(handler, "e", { ctrlKey: true });
    key(handler, "y", { ctrlKey: true });
    key(handler, "d", { ctrlKey: true });
    key(handler, "u", { ctrlKey: true });
    key(handler, "f", { ctrlKey: true });
    key(handler, "b", { ctrlKey: true });

    assert.deepEqual(harness.calls.map(({ top }) => top), [25.6, -25.6, 400, -400, 720, -720]);
});

test("interactive elements keep their browser behavior", () => {
    const harness = createHarness();
    const handler = createVimMotionHandler(harness.window, harness.document);
    const link = { tagName: "A", parentElement: harness.document.body };

    handler.handleKeydown({
        key: "j",
        target: link,
        defaultPrevented: false,
        isComposing: false,
        metaKey: false,
        altKey: false,
        ctrlKey: false,
        preventDefault() {
            this.prevented = true;
        },
        stopPropagation() {
            this.stopped = true;
        },
    });

    assert.equal(harness.calls.length, 0);
});
