import React, { useState, useRef, useEffect } from "react";
import { Phone, ChevronDown, Search } from "lucide-react";

interface PhoneCodeSelectProps {
  id?: string;
  name?: string;
  value?: string;
  onChange?: (fullPhoneNumber: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  showIcon?: boolean;
  searchable?: boolean;
  defaultValue?: string;
}

// Pays disponibles avec codes ISO, préfixes téléphoniques et drapeaux
export const countries = [
  { code: "AF", name: "Afghanistan", prefix: "+93", flag: "🇦🇫" },
  { code: "ZA", name: "Afrique du Sud", prefix: "+27", flag: "🇿🇦" },
  { code: "AL", name: "Albanie", prefix: "+355", flag: "🇦🇱" },
  { code: "DZ", name: "Algérie", prefix: "+213", flag: "🇩🇿" },
  { code: "DE", name: "Allemagne", prefix: "+49", flag: "🇩🇪" },
  { code: "AD", name: "Andorre", prefix: "+376", flag: "🇦🇩" },
  { code: "AO", name: "Angola", prefix: "+244", flag: "🇦🇴" },
  { code: "AI", name: "Anguilla", prefix: "+1264", flag: "🇦🇮" },
  { code: "AQ", name: "Antarctique", prefix: "+672", flag: "🇦🇶" },
  { code: "AG", name: "Antigua-et-Barbuda", prefix: "+1268", flag: "🇦🇬" },
  { code: "SA", name: "Arabie saoudite", prefix: "+966", flag: "🇸🇦" },
  { code: "AR", name: "Argentine", prefix: "+54", flag: "🇦🇷" },
  { code: "AM", name: "Arménie", prefix: "+374", flag: "🇦🇲" },
  { code: "AW", name: "Aruba", prefix: "+297", flag: "🇦🇼" },
  { code: "AU", name: "Australie", prefix: "+61", flag: "🇦🇺" },
  { code: "AT", name: "Autriche", prefix: "+43", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaïdjan", prefix: "+994", flag: "🇦🇿" },
  { code: "BS", name: "Bahamas", prefix: "+1242", flag: "🇧🇸" },
  { code: "BH", name: "Bahreïn", prefix: "+973", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh", prefix: "+880", flag: "🇧🇩" },
  { code: "BB", name: "Barbade", prefix: "+1246", flag: "🇧🇧" },
  { code: "BY", name: "Biélorussie", prefix: "+375", flag: "🇧🇾" },
  { code: "BE", name: "Belgique", prefix: "+32", flag: "🇧🇪" },
  { code: "BZ", name: "Belize", prefix: "+501", flag: "🇧🇿" },
  { code: "BJ", name: "Bénin", prefix: "+229", flag: "🇧🇯" },
  { code: "BM", name: "Bermudes", prefix: "+1441", flag: "🇧🇲" },
  { code: "BT", name: "Bhoutan", prefix: "+975", flag: "🇧🇹" },
  { code: "BO", name: "Bolivie", prefix: "+591", flag: "🇧🇴" },
  {
    code: "BQ",
    name: "Bonaire, Saint-Eustache et Saba",
    prefix: "+599",
    flag: "🇧🇶",
  },
  { code: "BA", name: "Bosnie-Herzégovine", prefix: "+387", flag: "🇧🇦" },
  { code: "BW", name: "Botswana", prefix: "+267", flag: "🇧🇼" },
  { code: "BV", name: "Île Bouvet", prefix: "+47", flag: "🇧🇻" },
  { code: "BR", name: "Brésil", prefix: "+55", flag: "🇧🇷" },
  { code: "BN", name: "Brunei", prefix: "+673", flag: "🇧🇳" },
  { code: "BG", name: "Bulgarie", prefix: "+359", flag: "🇧🇬" },
  { code: "BF", name: "Burkina Faso", prefix: "+226", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", prefix: "+257", flag: "🇧🇮" },
  { code: "CV", name: "Cap-Vert", prefix: "+238", flag: "🇨🇻" },
  { code: "KH", name: "Cambodge", prefix: "+855", flag: "🇰🇭" },
  { code: "CM", name: "Cameroun", prefix: "+237", flag: "🇨🇲" },
  { code: "CA", name: "Canada", prefix: "+1", flag: "🇨🇦" },
  { code: "CL", name: "Chili", prefix: "+56", flag: "🇨🇱" },
  { code: "CN", name: "Chine", prefix: "+86", flag: "🇨🇳" },
  { code: "CX", name: "Île Christmas", prefix: "+61", flag: "🇨🇽" },
  { code: "CY", name: "Chypre", prefix: "+357", flag: "🇨🇾" },
  { code: "CC", name: "Îles Cocos", prefix: "+61", flag: "🇨🇨" },
  { code: "CO", name: "Colombie", prefix: "+57", flag: "🇨🇴" },
  { code: "KM", name: "Comores", prefix: "+269", flag: "🇰🇲" },
  { code: "CG", name: "République du Congo", prefix: "+242", flag: "🇨🇬" },
  {
    code: "CD",
    name: "République démocratique du Congo",
    prefix: "+243",
    flag: "🇨🇩",
  },
  { code: "CK", name: "Îles Cook", prefix: "+682", flag: "🇨🇰" },
  { code: "KR", name: "Corée du Sud", prefix: "+82", flag: "🇰🇷" },
  { code: "KP", name: "Corée du Nord", prefix: "+850", flag: "🇰🇵" },
  { code: "CR", name: "Costa Rica", prefix: "+506", flag: "🇨🇷" },
  { code: "CI", name: "Côte d'Ivoire", prefix: "+225", flag: "🇨🇮" },
  { code: "HR", name: "Croatie", prefix: "+385", flag: "🇭🇷" },
  { code: "CU", name: "Cuba", prefix: "+53", flag: "🇨🇺" },
  { code: "CW", name: "Curaçao", prefix: "+599", flag: "🇨🇼" },
  { code: "DK", name: "Danemark", prefix: "+45", flag: "🇩🇰" },
  { code: "DJ", name: "Djibouti", prefix: "+253", flag: "🇩🇯" },
  { code: "DM", name: "Dominique", prefix: "+1767", flag: "🇩🇲" },
  { code: "EG", name: "Égypte", prefix: "+20", flag: "🇪🇬" },
  { code: "SV", name: "Salvador", prefix: "+503", flag: "🇸🇻" },
  { code: "AE", name: "Émirats arabes unis", prefix: "+971", flag: "🇦🇪" },
  { code: "EC", name: "Équateur", prefix: "+593", flag: "🇪🇨" },
  { code: "ER", name: "Érythrée", prefix: "+291", flag: "🇪🇷" },
  { code: "ES", name: "Espagne", prefix: "+34", flag: "🇪🇸" },
  { code: "EE", name: "Estonie", prefix: "+372", flag: "🇪🇪" },
  { code: "US", name: "États-Unis", prefix: "+1", flag: "🇺🇸" },
  { code: "ET", name: "Éthiopie", prefix: "+251", flag: "🇪🇹" },
  { code: "FK", name: "Îles Malouines", prefix: "+500", flag: "🇫🇰" },
  { code: "FO", name: "Îles Féroé", prefix: "+298", flag: "🇫🇴" },
  { code: "FJ", name: "Fidji", prefix: "+679", flag: "🇫🇯" },
  { code: "FI", name: "Finlande", prefix: "+358", flag: "🇫🇮" },
  { code: "FR", name: "France", prefix: "+33", flag: "🇫🇷" },
  { code: "GA", name: "Gabon", prefix: "+241", flag: "🇬🇦" },
  { code: "GM", name: "Gambie", prefix: "+220", flag: "🇬🇲" },
  { code: "GE", name: "Géorgie", prefix: "+995", flag: "🇬🇪" },
  {
    code: "GS",
    name: "Géorgie du Sud-et-les Îles Sandwich du Sud",
    prefix: "+500",
    flag: "🇬🇸",
  },
  { code: "GH", name: "Ghana", prefix: "+233", flag: "🇬🇭" },
  { code: "GI", name: "Gibraltar", prefix: "+350", flag: "🇬🇮" },
  { code: "GR", name: "Grèce", prefix: "+30", flag: "🇬🇷" },
  { code: "GD", name: "Grenade", prefix: "+1473", flag: "🇬🇩" },
  { code: "GL", name: "Groenland", prefix: "+299", flag: "🇬🇱" },
  { code: "GP", name: "Guadeloupe", prefix: "+590", flag: "🇬🇵" },
  { code: "GU", name: "Guam", prefix: "+1671", flag: "🇬🇺" },
  { code: "GT", name: "Guatemala", prefix: "+502", flag: "🇬🇹" },
  { code: "GG", name: "Guernesey", prefix: "+44", flag: "🇬🇬" },
  { code: "GN", name: "Guinée", prefix: "+224", flag: "🇬🇳" },
  { code: "GW", name: "Guinée-Bissau", prefix: "+245", flag: "🇬🇼" },
  { code: "GQ", name: "Guinée équatoriale", prefix: "+240", flag: "🇬🇶" },
  { code: "GY", name: "Guyana", prefix: "+592", flag: "🇬🇾" },
  { code: "GF", name: "Guyane française", prefix: "+594", flag: "🇬🇫" },
  { code: "HT", name: "Haïti", prefix: "+509", flag: "🇭🇹" },
  { code: "HM", name: "Îles Heard-et-MacDonald", prefix: "+672", flag: "🇭🇲" },
  { code: "HN", name: "Honduras", prefix: "+504", flag: "🇭🇳" },
  { code: "HK", name: "Hong Kong", prefix: "+852", flag: "🇭🇰" },
  { code: "HU", name: "Hongrie", prefix: "+36", flag: "🇭🇺" },
  { code: "IM", name: "Île de Man", prefix: "+44", flag: "🇮🇲" },
  {
    code: "UM",
    name: "Îles mineures éloignées des États-Unis",
    prefix: "+1",
    flag: "🇺🇲",
  },
  {
    code: "VG",
    name: "Îles Vierges britanniques",
    prefix: "+1284",
    flag: "🇻🇬",
  },
  {
    code: "VI",
    name: "Îles Vierges des États-Unis",
    prefix: "+1340",
    flag: "🇻🇮",
  },
  { code: "IN", name: "Inde", prefix: "+91", flag: "🇮🇳" },
  { code: "ID", name: "Indonésie", prefix: "+62", flag: "🇮🇩" },
  { code: "IR", name: "Iran", prefix: "+98", flag: "🇮🇷" },
  { code: "IQ", name: "Irak", prefix: "+964", flag: "🇮🇶" },
  { code: "IE", name: "Irlande", prefix: "+353", flag: "🇮🇪" },
  { code: "IS", name: "Islande", prefix: "+354", flag: "🇮🇸" },
  { code: "IL", name: "Israël", prefix: "+972", flag: "🇮🇱" },
  { code: "IT", name: "Italie", prefix: "+39", flag: "🇮🇹" },
  { code: "JM", name: "Jamaïque", prefix: "+1876", flag: "🇯🇲" },
  { code: "JP", name: "Japon", prefix: "+81", flag: "🇯🇵" },
  { code: "JE", name: "Jersey", prefix: "+44", flag: "🇯🇪" },
  { code: "JO", name: "Jordanie", prefix: "+962", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", prefix: "+7", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", prefix: "+254", flag: "🇰🇪" },
  { code: "KG", name: "Kirghizistan", prefix: "+996", flag: "🇰🇬" },
  { code: "KI", name: "Kiribati", prefix: "+686", flag: "🇰🇮" },
  { code: "KW", name: "Koweït", prefix: "+965", flag: "🇰🇼" },
  { code: "LA", name: "Laos", prefix: "+856", flag: "🇱🇦" },
  { code: "LS", name: "Lesotho", prefix: "+266", flag: "🇱🇸" },
  { code: "LV", name: "Lettonie", prefix: "+371", flag: "🇱🇻" },
  { code: "LB", name: "Liban", prefix: "+961", flag: "🇱🇧" },
  { code: "LR", name: "Liberia", prefix: "+231", flag: "🇱🇷" },
  { code: "LY", name: "Libye", prefix: "+218", flag: "🇱🇾" },
  { code: "LI", name: "Liechtenstein", prefix: "+423", flag: "🇱🇮" },
  { code: "LT", name: "Lituanie", prefix: "+370", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", prefix: "+352", flag: "🇱🇺" },
  { code: "MO", name: "Macao", prefix: "+853", flag: "🇲🇴" },
  { code: "MK", name: "Macédoine du Nord", prefix: "+389", flag: "🇲🇰" },
  { code: "MG", name: "Madagascar", prefix: "+261", flag: "🇲🇬" },
  { code: "MY", name: "Malaisie", prefix: "+60", flag: "🇲🇾" },
  { code: "MW", name: "Malawi", prefix: "+265", flag: "🇲🇼" },
  { code: "MV", name: "Maldives", prefix: "+960", flag: "🇲🇻" },
  { code: "ML", name: "Mali", prefix: "+223", flag: "🇲🇱" },
  { code: "MT", name: "Malte", prefix: "+356", flag: "🇲🇹" },
  { code: "MP", name: "Îles Mariannes du Nord", prefix: "+1670", flag: "🇲🇵" },
  { code: "MA", name: "Maroc", prefix: "+212", flag: "🇲🇦" },
  { code: "MH", name: "Îles Marshall", prefix: "+692", flag: "🇲🇭" },
  { code: "MQ", name: "Martinique", prefix: "+596", flag: "🇲🇶" },
  { code: "MU", name: "Maurice", prefix: "+230", flag: "🇲🇺" },
  { code: "MR", name: "Mauritanie", prefix: "+222", flag: "🇲🇷" },
  { code: "YT", name: "Mayotte", prefix: "+262", flag: "🇾🇹" },
  { code: "MX", name: "Mexique", prefix: "+52", flag: "🇲🇽" },
  { code: "FM", name: "Micronésie", prefix: "+691", flag: "🇫🇲" },
  { code: "MD", name: "Moldavie", prefix: "+373", flag: "🇲🇩" },
  { code: "MC", name: "Monaco", prefix: "+377", flag: "🇲🇨" },
  { code: "MN", name: "Mongolie", prefix: "+976", flag: "🇲🇳" },
  { code: "ME", name: "Monténégro", prefix: "+382", flag: "🇲🇪" },
  { code: "MS", name: "Montserrat", prefix: "+1664", flag: "🇲🇸" },
  { code: "MZ", name: "Mozambique", prefix: "+258", flag: "🇲🇿" },
  { code: "MM", name: "Myanmar", prefix: "+95", flag: "🇲🇲" },
  { code: "NA", name: "Namibie", prefix: "+264", flag: "🇳🇦" },
  { code: "NR", name: "Nauru", prefix: "+674", flag: "🇳🇷" },
  { code: "NP", name: "Népal", prefix: "+977", flag: "🇳🇵" },
  { code: "NI", name: "Nicaragua", prefix: "+505", flag: "🇳🇮" },
  { code: "NE", name: "Niger", prefix: "+227", flag: "🇳🇪" },
  { code: "NG", name: "Nigeria", prefix: "+234", flag: "🇳🇬" },
  { code: "NU", name: "Niue", prefix: "+683", flag: "🇳🇺" },
  { code: "NF", name: "Île Norfolk", prefix: "+672", flag: "🇳🇫" },
  { code: "NO", name: "Norvège", prefix: "+47", flag: "🇳🇴" },
  { code: "NC", name: "Nouvelle-Calédonie", prefix: "+687", flag: "🇳🇨" },
  { code: "NZ", name: "Nouvelle-Zélande", prefix: "+64", flag: "🇳🇿" },
  {
    code: "IO",
    name: "Territoire britannique de l'océan Indien",
    prefix: "+246",
    flag: "🇮🇴",
  },
  { code: "OM", name: "Oman", prefix: "+968", flag: "🇴🇲" },
  { code: "UG", name: "Ouganda", prefix: "+256", flag: "🇺🇬" },
  { code: "UZ", name: "Ouzbékistan", prefix: "+998", flag: "🇺🇿" },
  { code: "PK", name: "Pakistan", prefix: "+92", flag: "🇵🇰" },
  { code: "PW", name: "Palaos", prefix: "+680", flag: "🇵🇼" },
  { code: "PS", name: "Palestine", prefix: "+970", flag: "🇵🇸" },
  { code: "PA", name: "Panama", prefix: "+507", flag: "🇵🇦" },
  { code: "PG", name: "Papouasie-Nouvelle-Guinée", prefix: "+675", flag: "🇵🇬" },
  { code: "PY", name: "Paraguay", prefix: "+595", flag: "🇵🇾" },
  { code: "NL", name: "Pays-Bas", prefix: "+31", flag: "🇳🇱" },
  { code: "PE", name: "Pérou", prefix: "+51", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", prefix: "+63", flag: "🇵🇭" },
  { code: "PN", name: "Îles Pitcairn", prefix: "+64", flag: "🇵🇳" },
  { code: "PL", name: "Pologne", prefix: "+48", flag: "🇵🇱" },
  { code: "PF", name: "Polynésie française", prefix: "+689", flag: "🇵🇫" },
  { code: "PR", name: "Porto Rico", prefix: "+1787", flag: "🇵🇷" },
  { code: "PT", name: "Portugal", prefix: "+351", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", prefix: "+974", flag: "🇶🇦" },
  { code: "SY", name: "République arabe syrienne", prefix: "+963", flag: "🇸🇾" },
  { code: "CF", name: "République centrafricaine", prefix: "+236", flag: "🇨🇫" },
  { code: "DO", name: "République dominicaine", prefix: "+1809", flag: "🇩🇴" },
  { code: "RE", name: "La Réunion", prefix: "+262", flag: "🇷🇪" },
  { code: "RO", name: "Roumanie", prefix: "+40", flag: "🇷🇴" },
  { code: "GB", name: "Royaume-Uni", prefix: "+44", flag: "🇬🇧" },
  { code: "RU", name: "Russie", prefix: "+7", flag: "🇷🇺" },
  { code: "RW", name: "Rwanda", prefix: "+250", flag: "🇷🇼" },
  { code: "EH", name: "Sahara occidental", prefix: "+212", flag: "🇪🇭" },
  { code: "BL", name: "Saint-Barthélemy", prefix: "+590", flag: "🇧🇱" },
  { code: "KN", name: "Saint-Kitts-et-Nevis", prefix: "+1869", flag: "🇰🇳" },
  { code: "SM", name: "Saint-Marin", prefix: "+378", flag: "🇸🇲" },
  {
    code: "MF",
    name: "Saint-Martin (partie française)",
    prefix: "+590",
    flag: "🇲🇫",
  },
  {
    code: "SX",
    name: "Saint-Martin (partie néerlandaise)",
    prefix: "+1721",
    flag: "🇸🇽",
  },
  { code: "PM", name: "Saint-Pierre-et-Miquelon", prefix: "+508", flag: "🇵🇲" },
  { code: "VA", name: "Saint-Siège", prefix: "+379", flag: "🇻🇦" },
  {
    code: "VC",
    name: "Saint-Vincent-et-les-Grenadines",
    prefix: "+1784",
    flag: "🇻🇨",
  },
  {
    code: "SH",
    name: "Sainte-Hélène, Ascension et Tristan da Cunha",
    prefix: "+290",
    flag: "🇸🇭",
  },
  { code: "LC", name: "Sainte-Lucie", prefix: "+1758", flag: "🇱🇨" },
  { code: "SB", name: "Îles Salomon", prefix: "+677", flag: "🇸🇧" },
  { code: "WS", name: "Samoa", prefix: "+685", flag: "🇼🇸" },
  { code: "AS", name: "Samoa américaines", prefix: "+1684", flag: "🇦🇸" },
  { code: "ST", name: "Sao Tomé-et-Principe", prefix: "+239", flag: "🇸🇹" },
  { code: "SN", name: "Sénégal", prefix: "+221", flag: "🇸🇳" },
  { code: "RS", name: "Serbie", prefix: "+381", flag: "🇷🇸" },
  { code: "SC", name: "Seychelles", prefix: "+248", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", prefix: "+232", flag: "🇸🇱" },
  { code: "SG", name: "Singapour", prefix: "+65", flag: "🇸🇬" },
  { code: "SK", name: "Slovaquie", prefix: "+421", flag: "🇸🇰" },
  { code: "SI", name: "Slovénie", prefix: "+386", flag: "🇸🇮" },
  { code: "SO", name: "Somalie", prefix: "+252", flag: "🇸🇴" },
  { code: "SD", name: "Soudan", prefix: "+249", flag: "🇸🇩" },
  { code: "SS", name: "Soudan du Sud", prefix: "+211", flag: "🇸🇸" },
  { code: "LK", name: "Sri Lanka", prefix: "+94", flag: "🇱🇰" },
  { code: "SE", name: "Suède", prefix: "+46", flag: "🇸🇪" },
  { code: "CH", name: "Suisse", prefix: "+41", flag: "🇨🇭" },
  { code: "SR", name: "Suriname", prefix: "+597", flag: "🇸🇷" },
  { code: "SJ", name: "Svalbard et Jan Mayen", prefix: "+47", flag: "🇸🇯" },
  { code: "SZ", name: "Eswatini", prefix: "+268", flag: "🇸🇿" },
  { code: "TJ", name: "Tadjikistan", prefix: "+992", flag: "🇹🇯" },
  { code: "TW", name: "Taïwan", prefix: "+886", flag: "🇹🇼" },
  { code: "TZ", name: "Tanzanie", prefix: "+255", flag: "🇹🇿" },
  { code: "TD", name: "Tchad", prefix: "+235", flag: "🇹🇩" },
  { code: "CZ", name: "République tchèque", prefix: "+420", flag: "🇨🇿" },
  {
    code: "TF",
    name: "Terres australes françaises",
    prefix: "+262",
    flag: "🇹🇫",
  },
  { code: "TH", name: "Thaïlande", prefix: "+66", flag: "🇹🇭" },
  { code: "TL", name: "Timor oriental", prefix: "+670", flag: "🇹🇱" },
  { code: "TG", name: "Togo", prefix: "+228", flag: "🇹🇬" },
  { code: "TK", name: "Tokelau", prefix: "+690", flag: "🇹🇰" },
  { code: "TO", name: "Tonga", prefix: "+676", flag: "🇹🇴" },
  { code: "TT", name: "Trinité-et-Tobago", prefix: "+1868", flag: "🇹🇹" },
  { code: "TN", name: "Tunisie", prefix: "+216", flag: "🇹🇳" },
  { code: "TM", name: "Turkménistan", prefix: "+993", flag: "🇹🇲" },
  { code: "TC", name: "Îles Turques-et-Caïques", prefix: "+1649", flag: "🇹🇨" },
  { code: "TR", name: "Turquie", prefix: "+90", flag: "🇹🇷" },
  { code: "TV", name: "Tuvalu", prefix: "+688", flag: "🇹🇻" },
  { code: "UA", name: "Ukraine", prefix: "+380", flag: "🇺🇦" },
  { code: "UY", name: "Uruguay", prefix: "+598", flag: "🇺🇾" },
  { code: "VU", name: "Vanuatu", prefix: "+678", flag: "🇻🇺" },
  { code: "VE", name: "Venezuela", prefix: "+58", flag: "🇻🇪" },
  { code: "VN", name: "Viêt Nam", prefix: "+84", flag: "🇻🇳" },
  { code: "WF", name: "Wallis-et-Futuna", prefix: "+681", flag: "🇼🇫" },
  { code: "YE", name: "Yémen", prefix: "+967", flag: "🇾🇪" },
  { code: "ZM", name: "Zambie", prefix: "+260", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", prefix: "+263", flag: "🇿🇼" },
];

// Fonction utilitaire pour trouver un pays par son code
export const findCountryByCode = (code: string) => {
  return countries.find((country) => country.code === code);
};

// Fonction utilitaire pour obtenir le nom d'un pays par son code
export const getCountryName = (code: string) => {
  const country = findCountryByCode(code);
  return country ? country.name : code;
};

// Fonction utilitaire pour obtenir le préfixe téléphonique d'un pays
export const getCountryPrefix = (code: string) => {
  const country = findCountryByCode(code);
  return country ? country.prefix : "+";
};

// Fonction utilitaire pour obtenir le drapeau d'un pays
export const getCountryFlag = (code: string) => {
  const country = findCountryByCode(code);
  return country ? country.flag : "🌍";
};

// Fonction utilitaire pour obtenir le format complet d'un pays (nom + préfixe)
export const getCountryDisplay = (code: string) => {
  const country = findCountryByCode(code);
  return country ? `${country.name} (${country.prefix})` : code;
};

// Fonction utilitaire pour obtenir le format complet avec drapeau (drapeau + nom + préfixe)
export const getCountryDisplayWithFlag = (code: string) => {
  const country = findCountryByCode(code);
  return country
    ? `${country.flag} ${country.name} (${country.prefix})`
    : `🌍 ${code}`;
};

const PhoneCodeSelect: React.FC<PhoneCodeSelectProps> = ({
  id = "phone-code-select",
  name = "phone",
  value,
  onChange,
  disabled = false,
  required = false,
  className = "",
  placeholder = "Sélectionner un pays",
  showIcon = true,
  searchable = false,
  defaultValue = "BJ", // Bénin par défaut
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState(defaultValue);
  const selectRef = useRef<HTMLDivElement>(null);
  const lastNotifiedValue = useRef<string>(value || "");
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Synchroniser quand la prop value change depuis l'extérieur
  useEffect(() => {
    if (value === undefined || value === null || value === lastNotifiedValue.current) {
      return;
    }
    lastNotifiedValue.current = value;
    if (value) {
      const country = countries.find((c) => value.startsWith(c.prefix));
      if (country) {
        setSelectedCountryCode(country.code);
        setPhoneNumber(value.substring(country.prefix.length));
      } else {
        setPhoneNumber(value);
      }
    } else {
      setPhoneNumber("");
      if (defaultValue) {
        setSelectedCountryCode(defaultValue);
      }
    }
  }, [value, defaultValue]);

  // Mettre à jour le champ caché quand le pays ou le numéro change
  useEffect(() => {
    const prefix = countries.find((c) => c.code === selectedCountryCode)?.prefix || "+229";
    const cleanPhoneNumber = phoneNumber.replace(/\s/g, "");
    const fullNumber = cleanPhoneNumber ? `${prefix}${cleanPhoneNumber}` : "";
    const hiddenInput = document.getElementById(id) as HTMLInputElement;
    if (hiddenInput) {
      hiddenInput.value = fullNumber;
    }
    if (fullNumber !== lastNotifiedValue.current) {
      lastNotifiedValue.current = fullNumber;
      onChangeRef.current?.(fullNumber);
    }
  }, [selectedCountryCode, phoneNumber, id]);
  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.prefix.includes(searchTerm)
  );

  // Gérer les clics en dehors pour fermer la dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trouver le pays sélectionné
  const selectedCountry = countries.find((country) => country.code === selectedCountryCode);

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    setIsOpen(false);
    setSearchTerm("");
  };

  // Mode searchable (dropdown personnalisée)
  if (searchable) {
    return (
      <div className="relative" ref={selectRef}>
        <div className="flex h-10">
          {/* Sélecteur de pays */}
          <div className="relative w-1/3 h-full">
            {showIcon && (
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
            )}
            <div
              className={`w-full h-full px-3 py-2 border border-gray-300 border-r-0 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 cursor-pointer flex items-center ${showIcon ? "pl-10" : "pl-3"}`}
              onClick={() => !disabled && setIsOpen(!isOpen)}
              style={{ opacity: disabled ? 0.5 : 1 }}
            >
              <span className={selectedCountry ? "text-gray-900" : "text-gray-500"}>
                {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.prefix}` : placeholder}
              </span>
            </div>
            <ChevronDown
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform z-10 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Champ numéro de téléphone */}
          <div className="flex-1 h-full">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={disabled}
              placeholder="01 00 00 00 00"
              className="w-full h-full px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
            {/* Search input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un pays..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-40 overflow-y-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors text-sm flex items-center gap-2 ${
                      country.code === value
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-900"
                    }`}
                    onClick={() => handleCountrySelect(country.code)}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span>{country.name}</span>
                    <span className="text-gray-500 ml-auto">{country.prefix}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  Aucun pays trouvé
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hidden input for form compatibility */}
        <input
          type="hidden"
          id={id}
          name={name}
          required={required}
        />
      </div>
    );
  }

  // Mode classique (select natif)
  return (
    <div className="flex h-10">
      {/* Sélecteur de pays */}
      <div className="relative w-1/3 h-full">
        {showIcon && (
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        )}
        <select
          id={`${id}-country`}
          name={`${name}-country`}
          value={selectedCountryCode}
          onChange={(e) => setSelectedCountryCode(e.target.value)}
          disabled={disabled}
          required={required}
          className={`w-full h-full px-3 py-2 border border-gray-300 border-r-0 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 ${showIcon ? "pl-10" : "pl-3"} ${className}`}
        >
          <option value="">{placeholder}</option>
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.name} ({country.prefix})
            </option>
          ))}
        </select>
      </div>

      {/* Champ numéro de téléphone */}
      <div className="flex-1 h-full">
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          disabled={disabled}
          placeholder="01 00 00 00 00"
          className="w-full h-full px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
        />
      </div>

      {/* Hidden input for form compatibility */}
      <input
        type="hidden"
        id={id}
        name={name}
        required={required}
      />
    </div>
  );
};

export default PhoneCodeSelect;
