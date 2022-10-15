import mab from "../mab_framework/mab.js";


const	__token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MzQ5OTgyN2FmZGI3NzgzOWEyNmY2MDMiLCJpYXQiOjE2NjU3Njc5MTYsImV4cCI6MTY5NzMwMzkxNn0.UMjmas1ZyJlaXSS8S90vqdr7j3x_suHJMqM4EUD4_Y4";

const	app = () => {

	// GET
	// fetch("https://entreprise.data.gouv.fr/api/rna/v1/full_text/Croix+rouge")
	// 	.then((data) => data.text())
	// 	.then((data_text) => console.log(data_text));

	// GET
	// fetch("https://api.prosoliguide.fr/place/0?lang=fr", {
	// 	headers : {
	// 		"Authorization" : __token
	// 	}
	// })
	// 	.then((data) => data.text())
	// 	.then((data_text) => console.log(data_text));
	
	// POST METHOD
	const	body_data = {
		"location"	: {
			"geoType"	: "ville",
			"geoValue"	: "paris"
		}
	};



	fetch("https://api.prosoliguide.fr/new-search/", {
		headers : {
			"Authorization" : __token,
			"Content-Type"	: "application/json",
			"User-Agent"	: window.navigator.userAgent,
		},
		method	: "POST",
		body	: JSON.stringify(body_data),
	})
		.then((data) => data.text())
		.then((data_text) => console.log(data_text));

};

mab.init();

mab(document).ready(() => {

	app();

});
