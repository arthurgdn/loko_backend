const fusion_createdAtDesc = (array1,array2)=>{
    let i = 0
    let j = 0
    const finalArray = []
    while(i<array1.length || j<array2.length){
        if(i<array1.length && j<array2.length){
            if(array1[i].createdAt>array2[j].createdAt){
                finalArray.push(array1[i])
                i+= 1 
            }else{
                finalArray.push(array2[j])
                j+=1
            }
        }else{
            if(i<array1.length){
                finalArray.push(array1[i])
                i+=1
            }
            else{
                finalArray.push(array2[j])
                j+=1
            }
        }
    }
    return finalArray
}

module.exports = {
    fusion_createdAtDesc
}