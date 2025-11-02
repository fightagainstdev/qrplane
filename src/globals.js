let can,
    ctx,
    G,
    lastFrame = 0,
    w = window,
    canvasPrototype = CanvasRenderingContext2D.prototype,
    CANVAS_WIDTH = 1600,
    CANVAS_HEIGHT = 900;

inputMode = navigator.userAgent.match(nomangle(/andro|ipho|ipa|ipo/i)) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    ? INPUT_MODE_TOUCH
    : INPUT_MODE_KEYBOARD;

MONTHS = [
    // You didn't think I would include all the months, did you? Bytes are expensive!
    nomangle('一月'),
    nomangle('三月'),
    nomangle('四月'),
    nomangle('五月'),
    nomangle('六月'),
    nomangle('八月'),
    nomangle('九月'),
    nomangle('十月'),
];
COUNTRIES = [
    nomangle('北京市'),
    nomangle('上海市'),
    nomangle('广东省'),
    nomangle('江苏省'),
    nomangle('山东省'),
    nomangle('浙江省'),
    nomangle('河南省'),
    nomangle('湖北省'),
    nomangle('湖南省'),
    nomangle('四川省'),
];
