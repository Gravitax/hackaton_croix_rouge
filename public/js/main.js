import mab from "../mab_framework/mab.js";


// =======================================================================

/*
	on associe les donnees recuperees de lapi a un template commun
*/
const	create_new_template = (data) => {
	return (
		{
			"cp"			: data.cp,
			// "ville"			: data.ville,
			// "addr"			: data.addr,
			// "site"			: data.site,
			// "description"	: data.description,
			"name"			: data.name,
			// "update"		: data.update,
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

const	refaktor_postal_code = (value) => {
	if (!value || value.length < 1)
		return ("");
	let new_postal_code
	
	new_postal_code = value.substr(0, 2)
	return (new_postal_code);
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
			"cp"			: refaktor_postal_code(asso.position.codePostal),
			// "ville"			: asso.position.ville,
			// "addr"			: asso.position.adresse,
			// "site"			: asso.entity.website,
			// "description"	: asso.description,
			"name"			: asso.name,
			// "name_long"		: asso.entity.name,
			// "update"		: refaktor_update_value(asso.updatedAt),
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


// ========================================================================

/*
	On check si l'asso existe dans la BDD de Soliguide
*/
const	check_asso_exists = (asso_data) => {

	// console.log("check_asso_exist", window.latest_asso);
	for (let i = 0; i < window.soliguide_asso.length; i++) {
		if (window.latest_asso[0].fields.titre === window.soliguide_asso[i].name && window.latest_asso[0].fields.departement_code === window.soliguide_asso[i].cp)
			return (i);
	return (-1)
	}
}



// ========================================================================



// ========================================================================

const parse_name_asso = async () => {
	let name_asso;
	let	idx_asso;

	// console.log("parse_name_asso", window.latest_asso[0])
	for(let i = 0; i < 1000; i++) {
		name_asso = window.latest_asso[i];
		idx_asso = check_asso_exists();
		if (idx_asso != -1)
			return(window.latest_asso.slice(0, i))
	}
}

// ========================================================================

const	get_latest_asso = async () => {

	// GET
	await fetch(`https://journal-officiel-datadila.opendatasoft.com/api/records/1.0/search/?dataset=jo_associations&q=&rows=1000&sort=dateparution&facet=source&facet=annonce_type_facette&facet=localisation_facette&facet=metadonnees_type_code&facet=lieu_declaration_facette&facet=domaine_activite_categorise&facet=domaine_activite_libelle_categorise&refine.domaine_activite_categorise=19000`, {
		// await fetch(`https://entreprise.data.gouv.fr/api/rna/v1/full_text/${asso_data.name}`, {
	})
		.then((data) => data.json())
		.then((data_text) => {
			window.latest_asso.push(data_text.records[0])
			return (data_text)
		})
		.catch((error) => console.log(`get latest asso error : ${error}`));
		// .then((data) => data.json())
		// .then((data_text) => parse_soliguide(data_text))
		// .then((data) => data.text())
		// .then((data_text) => console.log(data_text));
		
	}
	
	// =======================================================================
	
	const	app = async () => {

		// creating global arrays
		window.soliguide_asso = [];
		window.rna_asso = [];
		window.latest_asso = [];

		
		// on recupere les asso soliguide templatees de facon propre
		console.log("phase : get SOLIGUIDE asso");
		await get_soliguide_asso();
		
		// // on recupere les dernieres assos dans l'API JO
		await get_latest_asso()
		// console.log("in app", window.latest_asso)

		// // on compare les 2 BDD
		await parse_name_asso()

		console.log(window.latest_asso)
		
	// console.log(window.soliguide_asso.length);
	// // on recupere les asso rna templatees de facon propre
	// console.log("phase : get RNA asso");
	// await get_rna_asso();
	// console.log(window.rna_asso.length);

	// console.log("phase : comparaison");
	console.log("done");
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
