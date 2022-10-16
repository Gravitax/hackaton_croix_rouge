import mab from "../mab_framework/mab.js";


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
	for (let i = 0; i < 1; i++) {
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
		asso_data = {
			"cp"			: asso.position.codePostal,
			"ville"			: asso.position.ville,
			"addr"			: asso.position.adresse,
			"site"			: asso.entity.website,
			"description"	: asso.description,
			"name"			: asso.name,
			"description"	: asso.description,
			"site"			: asso.entity.website,
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

/*
	On check si l'asso existe dans la BDD de Soliguide
*/
const	check_asso_exists = (asso_data) => {

	for (let i = 0; i < window.soliguide_asso.length; i++) {
		if (window.latest_asso[0][i].fields.titre === window.soliguide_asso[i].name
				&& window.latest_asso[0][i].fields.departement_code === window.soliguide_asso[i].cp.substr(0, 2))
			return (i);
		return (-1)
	}
}

const	parse_name_asso = async () => {
	let	name_asso, idx_asso;

	// console.log("parse_name_asso", window.latest_asso[0])
	for(let i = 0; i < 1000; i++) {
		name_asso = window.latest_asso[i];
		idx_asso = check_asso_exists();
		if (idx_asso != -1)
			window.latest_asso.slice(0, i)
			return ;
	}
}

const	get_latest_asso = async () => {

	// GET
	await fetch(`https://journal-officiel-datadila.opendatasoft.com/api/records/1.0/search/?dataset=jo_associations&q=&rows=10000&sort=dateparution&facet=source&facet=annonce_type_facette&facet=localisation_facette&facet=metadonnees_type_code&facet=lieu_declaration_facette&facet=domaine_activite_categorise&facet=domaine_activite_libelle_categorise&refine.domaine_activite_categorise=19000`, {
		// await fetch(`https://entreprise.data.gouv.fr/api/rna/v1/full_text/${asso_data.name}`, {
	})
		.then((data) => data.json())
		.then((data_text) => {
			window.latest_asso.push(data_text.records);
		})
		.catch((error) => console.log(`get latest asso error : ${error}`));
}

// ========================================================================

/*
	une fois les templates soliguide et rna crees
	il faut comparer les asso soliguide avec les asso window.rna (avec un id rna)
*/
const	compare_soliguide_rna = () => {
	let	soliguide, rna;

	for (let i = 0; i < window.rna.length; i++) {
		rna = window.rna[i];
		// console.log(rna);
	}
};

// ========================================================================

const	send_email = () => {
	const	template_params = {
		"from_name"	: "maboye",
		"to_name"	: "hackaton",
		"message"	: "ceci est mon message custom car on ne peut rien faire dautre"
	};

	emailjs.send("service_yobn9ho", "template_gfxybxf", template_params)
		.then((response) => {
			console.log("MAIL SENT SUCCESS!", response.status, response.text);
		}, (error) => {
			console.log("MAIL SENT FAILED...", error);
		});
};

// =======================================================================

let		display_card = (asso) => {

	let	box = document.getElementById("box");
	//let card = document.querySelector("div.card") ? document.querySelector("div.card") : document.createElement("div");
	let card = document.createElement("div");
	box.innerHTML = "";
	card.classList.add("card", "m-3");
	card.style.width = "35%";
	card.innerHTML ='<div class="card-header">' + '<h5>' + asso.name + '</h5>' + '</div>' +
					'<ul class="list-group list-group-flush">'  +
					'<li class="list-group-item">'+ '<b>Code postal</b> ' + asso.cp + '</li>'  +
					'<li class="list-group-item">'+ '<b>Ville</b> ' + asso.ville + '</li>'  +
					'<li class="list-group-item">'+ '<b>Adresse</b> ' + asso.addr + '</li>'  +
					'<li class="list-group-item">'+ '<b>Description</b> ' + asso.description + '</li>'  +
					'<li class="list-group-item">'+ '<b>Derniere maj</b> ' + asso.update + '</li>'  +
					'<li class="list-group-item">'+ '<b>Site web</b> ' + asso.site + '</li>'  +
  					'</ul>';
	box.appendChild(card);
};

// =======================================================================

let		display_next = () => {
	window.asso_index += 1;
	display_card(window.soliguide_asso[window.asso_index]);
}

// =======================================================================

const	app = async () => {

	let	next_button = document.getElementById("next");
	let	compare_button = document.getElementById("compare");
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
	//affichage de la premiere soliguide_asso
	display_card(window.soliguide_asso[window.asso_index]);
	next_button.style.display = "block";
	compare_button.style.display = "block";

	// on recupere les asso rna templatees de facon propre
	console.log("phase : get RNA asso");
	await get_rna_asso();

	// on compare les templates soliguide et rna afin de check si il y a eu une modification
	console.log("phase : comparaison");
	compare_soliguide_rna();
}

// =======================================================================

let		get_info_asso = async (rna) => {

	let info_asso = {};

	await fetch(`https://entreprise.data.gouv.fr/api/rna/v1/id/${rna}`)
		.then((data) => data.json())
		.then((data_json) => {
			info_asso = {
				"rna"			: rna,
				"cp"			: data_json.association.adresse_code_postal,
				"ville"			: data_json.association.adresse_gestion_acheminement.toLowerCase(),
				"addr"			: data_json.association.adresse_gestion_libelle_voie,
				"name"			: data_json.association.titre_court,
				"name_long"		: data_json.association.titre,
				"update"		: data_json.association.derniere_maj,
			};
		})
		.catch((error) => console.log(`get rna error : ${error}`));
	return (info_asso);
}
// =======================================================================

let		display_both_cards = (asso_soliguide, asso_gouv) => {

	let	box = document.getElementById("box");
	//let card = document.querySelector("div.card") ? document.querySelector("div.card") : document.createElement("div");
	let card = document.createElement("div");
	box.innerHTML = "";
	card.classList.add("card", "m-3");
	card.style.width = "35%";
	card.innerHTML ='<div class="card-header">' + '<h5>' + asso_soliguide.name + '</h5>' + '</div>' +
					'<ul class="list-group list-group-flush">'  +
					'<li class="list-group-item">'+ '<b>Code postal</b> ' + asso_soliguide.cp + '</li>'  +
					'<li class="list-group-item">'+ '<b>Ville</b> ' + asso_soliguide.ville + '</li>'  +
					'<li class="list-group-item">'+ '<b>Adresse</b> ' + asso_soliguide.addr + '</li>'  +
					'<li class="list-group-item">'+ '<b>Description</b> ' + asso_soliguide.description + '</li>'  +
					'<li class="list-group-item">'+ '<b>Derniere maj</b> ' + asso_soliguide.update + '</li>'  +
					'<li class="list-group-item">'+ '<b>Site web</b> ' + asso_soliguide.site + '</li>'  +
  					'</ul>';
	box.appendChild(card);
	let card2 = document.createElement("div");
	card2.classList.add("card", "m-3");
	card2.style.width = "35%";
	card2.innerHTML ='<div class="card-header">' + '<h5>' + asso_gouv.name + '</h5>' + '</div>' +
					'<ul class="list-group list-group-flush">'  +
					'<li class="list-group-item">'+ '<b>Num RNA</b> ' + asso_gouv.rna + '</li>'  +
					'<li class="list-group-item">'+ '<b>Code postal</b> ' + asso_gouv.cp + '</li>'  +
					'<li class="list-group-item">'+ '<b>Ville</b> ' + asso_gouv.ville + '</li>'  +
					'<li class="list-group-item">'+ '<b>Adresse</b> ' + asso_gouv.addr + '</li>'  +
					'<li class="list-group-item">'+ '<b>Description</b> ' + asso_gouv.description + '</li>'  +
					'<li class="list-group-item">'+ '<b>Derniere maj</b> ' + asso_gouv.update + '</li>'  +
					'<li class="list-group-item">'+ '<b>Site web</b> ' + asso_gouv.site + '</li>'  +
  					'</ul>';
	box.appendChild(card2);
};

// =======================================================================

let		get_rna_single_asso = async () => {

	let		data_rna = {};
	let		info_asso = {};

	console.log("event : get RNA single asso");
	data_rna = await format_rna(window.soliguide_asso[window.asso_index]);
	console.log(data_rna);
	console.log("event : get info asso if RNA");
	if (data_rna.rna)
	{
		info_asso = await get_info_asso(data_rna.rna);
		console.log(info_asso);
		display_both_cards(window.soliguide_asso[window.asso_index], info_asso);
	}
}

// =======================================================================

mab.init();

mab(document).ready(async () => {

	let load_button = document.getElementById("load");
	let	next_button = document.getElementById("next");
	let	compare_button = document.getElementById("compare");
	let	btn_email = document.getElementById("btn_email");

	console.log("phase : HTML is ready");

	load_button.addEventListener("click", app);
	next_button.addEventListener("click", display_next);
	compare_button.addEventListener("click", get_rna_single_asso);

	if (btn_email) {
		btn_email.addEventListener("click", async (e) => {
			e.preventDefault();

			if (!window.soliguide_asso || window.soliguide_asso.length < 1) {
				await app();
			}

			window.latest_asso = [];

			console.log("phase : get NEW asso");
			// on recupere les dernieres assos dans l'API JO
			await get_latest_asso();
			// on compare les 2 BDD
			await parse_name_asso();

			console.log(window.latest_asso);

			if (window.latest_asso) {
				console.log("there is some new asso");
				let	tmp = document.getElementById("email_result");

				if (tmp) {
					console.log("append to tmp");
					tmp.innerHTML += `${window.latest_asso[0].length} new assos detected<br />`;
				}
			}

			send_email();
		});
	}

});
