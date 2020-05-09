
//Fusionne deux tableaux d'objets triés par date décroissante de création
const fusion_createdAtDesc = (array1,array2)=>{
    let i = 0
    let j = 0
    const fusionnedArray = []
    while(i<array1.length || j<array2.length){
        if(i<array1.length && j<array2.length){
            if(array1[i].createdAt>array2[j].createdAt){
                fusionnedArray.push(array1[i])
                i+= 1 
            }else{
                fusionnedArray.push(array2[j])
                j+=1
            }
        }else{
            if(i<array1.length){
                fusionnedArray.push(array1[i])
                i+=1
            }
            else{
                fusionnedArray.push(array2[j])
                j+=1
            }
        }
    }
    return fusionnedArray
}

module.exports = {
    fusion_createdAtDesc
}