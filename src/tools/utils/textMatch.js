//Compares two strings and sends back true if they are considered to be alike
//They are considered alike when one sequence of characters matches in both
const textMatch = (searchString,stringToMatch)=>{
    return stringToMatch.toLowerCase().includes(searchString.toLowerCase());
}
module.exports = textMatch