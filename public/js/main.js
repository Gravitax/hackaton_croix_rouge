import mab from "../mab_framework/mab.js";


const	app = () => {

	console.log("app");

};

mab.init();

mab(document).ready(() => {

	app();

});
