import mab from "../mab_framework/mab.js";


const	__token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MzQ5OTgyN2FmZGI3NzgzOWEyNmY2MDMiLCJpYXQiOjE2NjU3Njc5MTYsImV4cCI6MTY5NzMwMzkxNn0.UMjmas1ZyJlaXSS8S90vqdr7j3x_suHJMqM4EUD4_Y4";

// =======================================================================

/*
	on formate les info du flux rna au format de notre template
*/
const	format_rna_data = async (asso_data) => {

	let	data = {};

	// GET
	await fetch(`https://entreprise.data.gouv.fr/api/rna/v1/full_text/${asso_data.name}`)
		.then((data) => data.json())
		.then((data_text) => data = data_text);

	return (data);
};

/*
	on query lapi rna afin de creer un nouveau template
*/
const	get_rna_template = async (asso_data) => {

	// on recupere les info de lasso sur le flux rna
	data = await format_rna_data(asso_data);
	// on cree le template
	return (create_new_template({
		"cp"			: data.cp,
		"ville"			: data.ville,
		"addr"			: data.addr,
		"site"			: data.site,
		"description"	: data.description,
		"name"			: data.name,
		"update"		: data.update,
	}))
};

// =======================================================================

/*
	on associe les donnees recuperees de lapi a un template commun
*/
const	create_new_template = (data) => {
	return (
		{
			"cp"			: data.cp,
			"ville"			: data.ville,
			"addr"			: data.addr,
			"site"			: data.site,
			"description"	: data.description,
			"name"			: data.name,
			"update"		: data.update,
		}
	);
};

/*
	on formate la date de facon plus lisible
*/
const	refaktor_update_value = (value) => {
	if (!value || value.length < 1)
		return ("");

	let	splitv = value.split('T');
	let	new_date = splitv[0];

	splitv = splitv[1].split('.');
	new_date = `${new_date} ${splitv[0]}`;

	console.log(new_date);
	return (new_date);
};

// =======================================================================

const	parse_soliguide = (flux) => {

	if (!flux || !flux.places)
		return ;

	flux = flux.places;

	console.log(flux);

	let	asso_data = {}, asso, rna_data;

	// on loop sur le flux afin de remplir le template qui servira de comparatif avec les infos de lapi detat
	for (let i = 0; i < flux.length; i++) {
		asso = flux[i];
		asso_data = create_new_template({
			"cp"			: asso.position.codePostal,
			"ville"			: asso.position.ville,
			"addr"			: asso.position.adresse,
			"site"			: asso.entity.website,
			"description"	: asso.description,
			"name"			: asso.name,
			"name_long"		: asso.entity.name,
			"update"		: refaktor_update_value(asso.updatedAt),
		});
		window.soliguide_asso.push(asso_data);

		// on va query lapi rna afin de creer un template quon va comparer au template de lasso cree via lapi soliguide
		rna_data = get_rna_template(asso_data);
	}

	console.log(window.soliguide_asso.length);

};

/*
	on recupere toutes les assoc de soliguide et on cree un nouveau template json avec des infos epurees
*/
const	get_all_soliguide_asso = () => {
	// POST
	const	body_data = {
		"options"	: {
			"limit"	: Infinity
		},
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
		.then((data) => data.json())
		.then((data_text) => parse_soliguide(data_text))
		.catch((error) => console.log(`error : ${error}`));
}

// =======================================================================

const	app = () => {

	// PRO ===============================================================

	// GET
	// fetch("https://api.prosoliguide.fr/place/0?lang=fr", {
	// 	headers : {
	// 		"Authorization" : __token
	// 	}
	// })
	// 	.then((data) => data.text())
	// 	.then((data_text) => console.log(data_text));
	
	// ===================================================================

	// creating a global array
	window.soliguide_asso = [];

	get_all_soliguide_asso();
};

// =======================================================================

mab.init();

mab(document).ready(() => {

	// 1 - on recupere toutes les asso
	// 2 - on list tout les titres + siret + nom / assoc
	// 3 - on check sur lapp gvt

	app();

});
