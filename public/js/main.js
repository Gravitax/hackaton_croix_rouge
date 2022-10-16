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
	let	data = {};

	// GET
	await fetch(`https://entreprise.data.gouv.fr/api/rna/v1/full_text/${asso_data.name}`, {
		mode	: "no-cors"
	})
		.then((data) => data.text())
		.then((data_text) => data = data_text)
		.catch((error) => console.log(`get rna error : ${error}`));

	// il faut formater data afin quil remplisse le template

	return (data);
};

/*
	on query lapi rna afin de creer un nouveau template
*/
const	get_rna_asso = async () => {
	let	data = {};

	// on loop sur toutes les asso soliguide et on recupere leurs data rna liees
	for (let i = 0; i < window.soliguide_asso.length; i++) {
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
	// await get_rna_asso();
	// console.log(window.rna_asso.length);

	console.log("phase : comparaison");
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
