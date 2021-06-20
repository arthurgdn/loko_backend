//Compare deux chaînes de caractères et renvoie 'true'
// si une sequence de caractères correspond à celle de l'autre

const textMatch = (searchString, stringToMatch)=>{
  return stringToMatch.toLowerCase().includes(searchString.toLowerCase());
};
module.exports = textMatch;