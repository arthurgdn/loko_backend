//Calcule la distance entre deux points
// étant donnée leur latitude ainsi que leur longitudes respectives

const  distanceLatLong = (lat1, lon1, lat2, lon2) => {
  if(!lat1 || !lat2) {
    return Infinity; //On renvoi une distance infinie si les paramètres sont mal passés
  }
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 +
            c(lat1 * p) * c(lat2 * p) *
            (1 - c((lon2 - lon1) * p))/2;

  return 12742 * Math.asin(Math.sqrt(a));
};


module.exports = {distanceLatLong};