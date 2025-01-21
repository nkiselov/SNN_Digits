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
        // train: readImagesLabels(trainSet, trainLabel),
        test: readImagesLabels(testSet, testLabel)
    }
}