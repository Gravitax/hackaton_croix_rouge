import mab from "../mab_framework/mab.js";


// =======================================================================

/*
	on associe les donnees recuperees de lapi a un template commun
*/
// const	create_new_template = (data) => {
// 	return (
// 		{
// 			"cp"			: data.cp,
// 			"ville"			: data.ville,
// 			"addr"			: data.addr,
// 			"site"			: data.site,
// 			"description"	: data.description,
// 			"name"			: data.name,
// 			"update"		: data.update,
// 		}
// 	);
// };


// =======================================================================
// RNA PART

const	parse_data_rna = (asso_data, data_rna) => {
	let	asso_rna = {};

	data_rna.forEach(d => {
		if (d.coordonnees && asso_data.cp == d.coordonnees.adresse_siege.code_postal)
			asso_rna = d;
	});
	return ({
		"cp"			: "",
		"ville"			: "",
		"addr"			: "",
		"name"			: "",
		"update"		: "",
		"rna"			: asso_rna.rna,
		"siren"			: asso_rna.siren
	});
};

/*
	on formate les info du flux rna au format de notre template
*/
const	format_rna = async (asso_data) => {
	let	data_rna = {};

	console.log("asso name : ", asso_data.name);

	// GET
	await fetch(`https://www.data-asso.fr/gw/api-server/associations/name/${asso_data.name}`)
		.then((data) => data.json())
		.then((data_json) => {
			data_rna = parse_data_rna(asso_data, data_json);
		})
		.catch((error) => console.log(`get rna error : ${error}`));

	// il faut formater data afin quil remplisse le template

	return (data_rna);
};

/*
	on query lapi rna afin de creer un nouveau template
*/
const	get_rna_asso = async () => {
	let	data = {};

	// on loop sur toutes les asso soliguide et on recupere leurs data rna liees
	for (let i = 0; i < 10; i++) {
		// on await format rna afin de rendre synchrone la variable data
		data = await format_rna(window.soliguide_asso[i]);
		// on cree et push le template
		window.rna_asso.push(data);

		// on push les asso qui ont un rna ou un siren
		if (data.rna)
			window.rna.push(data);
	}

	if (window.rna.length > 1) {
		console.log("phase : get RNA gouv");
		await get_rna_gouv();
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
		asso_data = {
			"cp"			: asso.position.codePostal,
			"ville"			: asso.position.ville,
			"addr"			: asso.position.adresse,
			"name"			: asso.name,
			"name_long"		: asso.entity.name,
			"update"		: refaktor_update_value(asso.updatedAt),
		};
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
	on remplit les infos via lapi gouv
*/
const	get_rna_gouv = async () => {
	for (let i = 0; i < window.rna.length; i++) {
		await fetch(`https://entreprise.data.gouv.fr/api/rna/v1/id/${window.rna[i].rna}`)
			.then((data) => data.json())
			.then((data_json) => {
				window.rna[i] = {
					"cp"			: data_json.association.adresse_code_postal,
					"ville"			: data_json.association.adresse_gestion_acheminement.toLowerCase(),
					"addr"			: data_json.association.adresse_gestion_libelle_voie,
					"name"			: data_json.association.titre_court,
					"name_long"		: data_json.association.titre,
					"update"		: data_json.association.derniere_maj,
				};
			})
			.catch((error) => console.log(`get rna error : ${error}`));
	}
};

// =======================================================================

const	get_soliguide = (name) => {
	for (let i = 0; i < window.soliguide_asso.length; i++) {
		if (window.soliguide_asso[i].name.toLowerCase() == name.toLowerCase())
			return (window.soliguide_asso[i]);
	}
};

/*
	une fois les templates soliguide et rna crees
	il faut comparer les asso soliguide avec les asso window.rna (avec un id rna)
*/
const	compare_soliguide_rna = () => {
	let	soliguide, rna;

	for (let i = 0; i < window.rna.length; i++) {
		rna = window.rna[i];
		soliguide = get_soliguide(window.rna[i].name);

		console.log(soliguide, rna);
	}
};

// =======================================================================

let		display_card = (asso) => {

	let card = document.querySelector("div.card") ? document.querySelector("div.card") : document.createElement("div");
	card.innerHTML = "";
	card.classList.add("card", "m-3");
	card.style.width = "35%";
	card.innerHTML ='<div class="card-header">' + asso.name + '</div>' +
					'<ul class="list-group list-group-flush">'  +
					'<li class="list-group-item">'+ asso.cp + '</li>'  +
					'<li class="list-group-item">'+ asso.ville + '</li>'  +
					'<li class="list-group-item">'+ asso.addr + '</li>'  +
					'<li class="list-group-item">'+ asso.description + '</li>'  +
					'<li class="list-group-item">'+ asso.update + '</li>'  +
					'<li class="list-group-item">'+ asso.site + '</li>'  +
  					'</ul>';
	document.body.append(card);
};

// =======================================================================

let		display_next = () => {
	window.asso_index += 1;
	display_card(window.soliguide_asso[window.asso_index]);
}

// =======================================================================

const	app = async () => {

	let	next_button = document.getElementById("next");
	// creating global arrays
	window.soliguide_asso = [];
	window.rna_asso = [];
	window.rna = [];
	window.asso_index = 0;
	// on recupere les asso soliguide templatees de facon propre
	console.log("phase : get SOLIGUIDE asso");
	await get_soliguide_asso();
	console.log(window.soliguide_asso.length);
	console.log(window.soliguide_asso[0]);
	display_card(window.soliguide_asso[window.asso_index]);
	next_button.style.display = "block";
	//affichage de la premiere soliguide_asso
	// for(let i = 0; i < window.soliguide_asso.length; i++)
	// {
	// 	display_card(window.soliguide_asso[i]);
	// }
	// on recupere les asso rna templatees de facon propre
	console.log("phase : get RNA asso");
	await get_rna_asso();

	console.log(window.rna);

	// console.log("phase : comparaison");
	// compare_soliguide_rna();
};

// =======================================================================

mab.init();

mab(document).ready(() => {

	let load_button = document.getElementById("load");
	let	next_button = document.getElementById("next");

	console.log("phase : HTML is ready");

	console.log("phase : start app");
	load_button.addEventListener("click", app);
	next_button.addEventListener("click", display_next);
	//app();


});
