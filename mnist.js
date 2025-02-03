const MNIST_SIZE = 28

function readImagesLabels(imagesArrayBuffer, labelsArrayBuffer) {
    function readUInt32BE(buffer, offset) {
        return (buffer[offset] << 24) | 
               (buffer[offset + 1] << 16) | 
               (buffer[offset + 2] << 8) | 
               buffer[offset + 3];
    }

    let imagesBuffer = new Uint8Array(imagesArrayBuffer)
    let labelsBuffer = new Uint8Array(labelsArrayBuffer)

    const labelsMagic = readUInt32BE(labelsBuffer, 0);
    if (labelsMagic !== 2049) {
        throw new Error(`Magic number mismatch, expected 2049, got ${labelsMagic}`);
    }
    
    const labelsCount = readUInt32BE(labelsBuffer, 4);
    const labels = Array.from(labelsBuffer.slice(8));
    
    const imagesMagic = readUInt32BE(imagesBuffer, 0);
    if (imagesMagic !== 2051) {
        throw new Error(`Magic number mismatch, expected 2051, got ${imagesMagic}`);
    }
    
    const imagesCount = readUInt32BE(imagesBuffer, 4);
    const rows = readUInt32BE(imagesBuffer, 8);
    const cols = readUInt32BE(imagesBuffer, 12);
    
    const imageData = imagesBuffer.slice(16);
    
    const images = [];
    const imageSize = rows * cols;
    
    for (let i = 0; i < imagesCount; i++) {
        const start = i * imageSize;
        const end = start + imageSize;
        const pixels = Array.from(imageData.slice(start, end));
        
        images.push(pixels);
    }
    
    return images.map(function(e, i) {
            return {
                img: e, 
                label: labels[i]
            }
        })
}

function imgBorder(img){
    let ilim = 10
    let borders = [0,0,0,0]
    for(let x=0; x<MNIST_SIZE; x++){
        let bad = false
        for(let y=0; y<MNIST_SIZE; y++){
            if(img[y*MNIST_SIZE+x]>ilim) bad = true
        }
        borders[0]=x
        if(bad) break;
    }
    for(let x=MNIST_SIZE-1; x>=0; x--){
        let bad = false
        for(let y=0; y<MNIST_SIZE; y++){
            if(img[y*MNIST_SIZE+x]>ilim) bad = true
        }
        borders[1]=MNIST_SIZE-1-x
        if(bad) break;
    }
    for(let y=0; y<MNIST_SIZE; y++){
        let bad = false
        for(let x=0; x<MNIST_SIZE; x++){
            if(img[y*MNIST_SIZE+x]>ilim) bad = true
        }
        borders[2]=y
        if(bad) break;
    }
    for(let y=MNIST_SIZE-1; y>=0; y--){
        let bad = false
        for(let x=0; x<MNIST_SIZE; x++){
            if(img[y*MNIST_SIZE+x]>ilim) bad = true
        }
        borders[3]=MNIST_SIZE-1-y
        if(bad) break;
    }
    return borders
}

function resampleImg(dx,dy,img){
    let newImg = Array(MNIST_SIZE*MNIST_SIZE).fill(0)
    for(let x=0; x<MNIST_SIZE; x++){
        for(let y=0; y<MNIST_SIZE; y++){
            let nx = x+dx
            let ny = y+dy
            if(nx<0 || nx>=MNIST_SIZE || ny<0 || ny>=MNIST_SIZE) continue
            newImg[ny*MNIST_SIZE+nx] = img[y*MNIST_SIZE+x]
        }
    }
    return newImg
}

function shuffle(array) {
    let currentIndex = array.length;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

function centerImage(img){
    let ax = 0
    let ay = 0
    let sm = 0
    for(let x=0; x<MNIST_SIZE; x++){
        for(let y=0; y<MNIST_SIZE; y++){
            ax+=img[y*MNIST_SIZE+x]*x
            ay+=img[y*MNIST_SIZE+x]*y
            sm+=img[y*MNIST_SIZE+x]
        }
    }
    let dx = Math.round((MNIST_SIZE-1)/2-ax/sm)
    let dy = Math.round((MNIST_SIZE-1)/2-ay/sm)
    return resampleImg(dx,dy,img)
}

function augmentDataset(set){
    return set.map((sample)=>{return{
        img: centerImage(sample.img),
        label: sample.label
    }})
    // let newSet = []
    // for(let i=0; i<set.length; i++){
    //     let brd = imgBorder(set[i].img)
    //     for(let j=0; j<5; j++){
    //         let dx = Math.round((brd[0]+brd[1])*Math.random()-brd[0]);
    //         let dy = Math.round((brd[2]+brd[3])*Math.random()-brd[2]);
    //         newSet.push({
    //             img: resampleImg(dx,dy,set[i].img),
    //             label: set[i].label
    //         })
    //     }
    // }
    // shuffle(newSet)
    // return newSet
}

async function readMNIST(){
    fetch('')
    .then(res => res.blob())
    .then(blob => {
        console.log(blob)
    });
    const filePromises = [
        fetch('./MNIST_ORG/train-images.idx3-ubyte').then(res => res.arrayBuffer()),
        fetch('./MNIST_ORG/train-labels.idx1-ubyte').then(res => res.arrayBuffer()),
        fetch('./MNIST_ORG/t10k-images.idx3-ubyte').then(res => res.arrayBuffer()),
        fetch('./MNIST_ORG/t10k-labels.idx1-ubyte').then(res => res.arrayBuffer())
    ];
    
    const [trainSet, trainLabel, testSet, testLabel] = await Promise.all(filePromises);
    
    return {
        train: augmentDataset(readImagesLabels(trainSet, trainLabel)),
        test: augmentDataset(readImagesLabels(testSet, testLabel))
    }
}

