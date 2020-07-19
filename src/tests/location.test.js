const {distanceLatLong} = require('../tools/utils/location')

test('Doit calculer la bonne distance entre deux points', ()=>{
    expect(Math.round(distanceLatLong(48.885130,2.080330,48.858580,2.294560))).toBe(16)
})



