import mab from "../mab_framework/mab.js";


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

// =======================================================================

const	send_email = () => {
	// window.emailjs.sendForm("contact_service", "contact_form", document.getElementById("contact-form"));

	const	template_params = {
		"from_name"	: "maboye",
		"to_name"	: "hackaton",
		"message"	: "ceci est mon message custom"
	};
	 
	// emailjs.send("service_yobn9ho", "template_gfxybxf", template_params)
	// 	.then((response) => {
	// 		console.log("SUCCESS!", response.status, response.text);
	// 	}, (error) => {
	// 		console.log("FAILED...", error);
	// 	});
};

// =======================================================================

const	app = async () => {
	// creating global arrays
	window.soliguide_asso = [];
	window.rna_asso = [];
	window.rna = [];
	// on recupere les asso soliguide templatees de facon propre
	console.log("phase : get SOLIGUIDE asso");
	await get_soliguide_asso();
	// on recupere les asso rna templatees de facon propre
	console.log("phase : get RNA asso");
	await get_rna_asso();

	// on compare les templates soliguide et rna afin de check si il y a eu une modification
	console.log("phase : comparaison");
	compare_soliguide_rna();

	// on check les derniers ajouts dasso aux api gouv
	// on envoit un mail pour les lister
	send_email();
};

// =======================================================================

mab.init();

mab(document).ready(async () => {

	console.log("phase : HTML is ready");

	// 1 - on recupere toutes les asso soliguide celon un template de donnees propre
	// 2 - pareil avec rna
	// 3 - on compare les deux rendu

	console.log("phase : START app");
	await app();
	console.log("phase : END app");

});
