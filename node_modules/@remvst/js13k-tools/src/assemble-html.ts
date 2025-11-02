import Mustache from 'mustache';

const INJECT_JS_TAG = 'JS_INJECTION_SITE';
const INJECT_CSS_TAG = 'CSS_INJECTION_SITE';

export function assembleHtml(opts: {
    html: string,
    css: string,
    js: string,
}) {
    return Mustache.render(opts.html, {
        [INJECT_CSS_TAG]: opts.css,
        [INJECT_JS_TAG]: opts.js,
    });
}
