import { RDF, SCHEMA_INRUPT } from "@inrupt/vocab-common-rdf";
import { buildThing, createThing } from "@inrupt/solid-client";

export default function genAddrThing(addrResourceURL) {
  return buildThing(createThing({name: addrResourceURL}))
    .setIri(RDF.type, SCHEMA_INRUPT.PostalAddress)
    .setStringNoLocale(SCHEMA_INRUPT.streetAddress, `${generateRandomNumber(1, 99)} ${getRandEl(names)} ${getRandEl(roadTypes)[1]}`)
    .setStringNoLocale(SCHEMA_INRUPT.postalCode, generateRandomNumber(1,9999).toString().padStart(4, "0"))
    .setStringNoLocale(SCHEMA_INRUPT.addressLocality, getRandEl(names) + "ville")
    .setStringNoLocale(SCHEMA_INRUPT.addressRegion, getRandEl(names) + "state")
    .setStringNoLocale(SCHEMA_INRUPT.addressCountry, getRandEl(names) + "land")
    .build();
}

const roadTypes = Object.entries({
  "Alley": "Aly",
  "Avenue": "Ave",
  "Boulevard": "Blvd",
  "Circle": "Cir",
  "Close": "Cl",
  "Court": "Ct",
  "Crescent": "Cres",
  "Cross": "Xing",
  "Drive": "Dr",
  "Expressway": "Expy",
  "Freeway": "Fwy",
  "Green": "Grn",
  "Grove": "Grv",
  "Heights": "Hts",
  "Highway": "Hwy",
  "Hill": "Hl",
  "Lane": "Ln",
  "Loop": "Loop",
  "Parkway": "Pkwy",
  "Place": "Pl",
  "Gardens": "Gdns",
  "Parade": "Pde",
  "Park": "Pk",
  "Path": "Path",
  "Ridge": "Rdg",
  "Road": "Rd",
  "Route": "Rt",
  "Square": "Sq",
  "Street": "St",
  "Terrace": "Ter",
  "Track": "Trk",
  "View": "Vw",
  "Walk": "Wk",
  "Way": "Way",
});

const names = [
  "Amelia", "Alexander",
  "Bella", "Benjamin",
  "Charlotte", "Christopher",
  "Daisy", "Daniel",
  "Emma", "Ethan",
  "Fiona", "Felix",
  "Grace", "Gabriel",
  "Harper", "Henry",
  "Isabella", "Isaac",
  "Julia", "Jack",
  "Katherine", "Kevin",
  "Lily", "Liam",
  "Mia", "Matthew",
  "Natalie", "Noah",
  "Olivia", "Owen",
  "Penelope", "Patrick",
  "Quinn", "Quentin",
  "Ruby", "Ryan",
  "Sophia", "Samuel",
  "Taylor", "Thomas",
  "Uma", "Uriel",
  "Victoria", "Vincent",
  "Willow", "William",
  "Xia", "Xavier",
  "Yara", "Yusuf",
  "Zoe", "Zachary",
];

const generateRandomNumber = (min, max) => {
  if (min > max) { [min, max] = [max, min]; }
  const range = max - min + 1;
  return Math.floor(Math.random() * range) + min;
};

const getRandEl = (array) => array[Math.floor(Math.random() * array.length)];
