import ElementCollection from "./modules/min/ElementCollection.min.js";
export const __is_mobile = [1024, window.innerWidth < 1025];
;
window.splide = {};
const mab = (param) => {
    if (typeof (param) === "string")
        return (new ElementCollection(...document.querySelectorAll(param)));
    return (new ElementCollection(param));
};
const load_splide = (head) => {
    if (document.querySelector(".splide")) {
        window.splide_tmp = {};
        head.create_element({ append: true, tag: "link", props: {
                "type": "text/css",
                "rel": "stylesheet",
                "href": `./public/mab_framework/css/splide.min.css`
            } });
    }
};
mab.init = () => {
    const head = mab("head");
    head.create_element({ append: true, tag: "link", props: {
            "type": "text/css",
            "rel": "stylesheet",
            "href": `./public/mab_framework/css/style.min.css`
        } });
    load_splide(head);
    mab(document).ready(() => {
        import("./modules/min/mount.min.js").then((Module) => {
            Module.default();
        });
    });
};
export default mab;
