
function eyeMatrix(size,val=1){
    return [...Array(size).keys()].map((ind1)=>[...Array(size).keys()].map((ind2)=>ind1==ind2?val:0))
}

function sameMatrix(n,m,val){
    return new Array(n).fill(0).map(()=>new Array(m).fill(val))
}

function randMatrix(n,m,min,max){
    return new Array(n).fill(0).map(()=>new Array(m).fill(0).map(()=>Math.random()*(max-min)+min))
}

function normalize(arr){
    let max = arr.reduce((mx, a) => Math.max(mx,a), 0)
    return arr.map(v=>v/max*255)
}

function weights2map(weights,sizePre,sizePost){
    let size = sizePre*sizePost
    let res = new Array(size*size)
    for(let x1=0; x1<sizePre; x1++){
        for(let y1=0; y1<sizePre; y1++){
            for(let x2=0; x2<sizePost; x2++){
                for(let y2=0; y2<sizePost; y2++){
                    let x = x1+x2*sizePre
                    let y = y1+y2*sizePre
                    res[y*size+x] = weights[x1+y1*sizePre][x2+y2*sizePost]
                }
            }
        }
    }
    return res
}

function sumArr(arr){
    return arr.reduce((sm, a) => sm+a, 0)
}

function addArr(to,from){
    for(let i=0; i<from.length; i++){
        to[i] += from[i]
    }
}