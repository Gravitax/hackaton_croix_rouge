import mab from "../mab_framework/mab.js";


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

// =======================================================================
// RNA PART

/*
	on formate les info du flux rna au format de notre template
*/

const	format_rna = async (asso_data) => {

	let	toto = {};

	// GET
	console.log(asso_data)
	await fetch(`https://entreprise.data.gouv.fr/api/rna/v1/full_text/<${asso_data.name}>`, {
		// await fetch(`https://entreprise.data.gouv.fr/api/rna/v1/full_text/${asso_data.name}`, {
	})
		.then((data) => data.json())
		.then((data_text) => {
			toto = data_text
			console.log(data_text)
		})
		.catch((error) => console.log(`get rna error : ${error}`));
	 
		// .then((data) => data.json())
		// .then((data_text) => parse_soliguide(data_text))
		// .then((data) => data.text())
		// .then((data_text) => console.log(data_text));

	return (toto)
};

/*
	on query lapi rna afin de creer un nouveau template
*/
const	get_rna_asso = async () => {
	let	data = {};

	// on loop sur toutes les asso soliguide et on recupere leurs data rna liees
	for (let i = 0; i < 1; i++) {
		// on await format rna afin de rendre synchrone la variable data
		data = await format_rna(window.soliguide_asso[i]);
		// on cree et push le template
		window.rna_asso.push(create_new_template({
			"cp"			: data.cp,
			"ville"			: data.ville,
			"addr"			: data.addr,
			"site"			: data.site,
			"description"	: data.description,
			"name"			: data.name,
			"update"		: data.update,
		}));
	}
};

// =======================================================================

// SOLIGUIDE PART

// access token to soliguide api
const	__token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MzQ5OTgyN2FmZGI3NzgzOWEyNmY2MDMiLCJpYXQiOjE2NjU3Njc5MTYsImV4cCI6MTY5NzMwMzkxNn0.UMjmas1ZyJlaXSS8S90vqdr7j3x_suHJMqM4EUD4_Y4";

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
	return (new_date);
};

const	parse_soliguide = (flux) => {

	if (!flux || !flux.places)
		return ;

	flux = flux.places;

	let	asso_data = {}, asso;

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
	}
};

/*
	on recupere toutes les assoc de soliguide et on cree un nouveau template json avec des infos epurees
*/
const	get_soliguide_asso = async () => {
	const	body_data = {
		"options"	: {
			"limit"	: Infinity
		},
		"location"	: {
			"geoType"	: "ville",
			"geoValue"	: "paris"
		}
	};

	await fetch("https://api.prosoliguide.fr/new-search/", {
		headers : {
			"Authorization" : __token,
			"Content-Type"	: "application/json",
			"User-Agent"	: window.navigator.userAgent,
		},
		method	: "POST",
		body	: JSON.stringify(body_data),
	})
		.then((data) => data.json())
		.then((data_json) => parse_soliguide(data_json))
		.catch((error) => console.log(`get soliguide error : ${error}`));
}

// =======================================================================

/*
	une fois les templates soliguide et rna crees il faut les comparer
*/
const	compare_soliguide_rna = () => {
	let	soliguide, rna;

	for (let i = 0; i < window.soliguide_asso.length; i++) {
		soliguide = window.soliguide_asso[i];
		rna = window.rna_asso[i];

		// console.log(soliguide, rna);
	}
};

// =======================================================================

const	app = async () => {
	// creating global arrays
	window.soliguide_asso = [];
	window.rna_asso = [];
	// on recupere les asso soliguide templatees de facon propre
	console.log("phase : get SOLIGUIDE asso");
	await get_soliguide_asso();
	console.log(window.soliguide_asso.length);
	// on recupere les asso rna templatees de facon propre
	console.log("phase : get RNA asso");
	await get_rna_asso();
	console.log(window.rna_asso.length);

	console.log("phase : comparaison");
	// compare_soliguide_rna();
};

// =======================================================================

mab.init();

mab(document).ready(() => {

	console.log("phase : HTML is ready");

	// 1 - on recupere toutes les asso soliguide celon un template de donnees propre
	// 2 - pareil avec rna
	// 3 - on compare les deux rendu

	console.log("phase : start app");
	app();

});
