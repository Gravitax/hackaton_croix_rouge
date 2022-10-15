var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
export const create_element = (_a) => {
    var data = __rest(_a, []);
    const element = document.createElement(data.tag);
    if (data.props) {
        for (const [key, value] of Object.entries(data.props))
            element.setAttribute(key, value);
    }
    if (data.innerText)
        element.innerText = data.innerText;
    if (data.innerHTML)
        element.innerHTML = data.innerHTML;
    return (element);
};
export const scroll_to = (href, offset) => {
    let tmp;
    let top;
    if (href) {
        tmp = document.querySelector(href);
        if (tmp) {
            top = tmp.getBoundingClientRect().top + window.scrollY;
            if (offset)
                top += offset;
            window.scrollTo({ top, behavior: "smooth" });
        }
    }
};
export const vw = (v) => {
    const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    return ((v * w) / 100);
};
export default {};
