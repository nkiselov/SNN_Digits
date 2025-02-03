readMNIST().then(dataset=>{

document.getElementById("loading").remove()

console.log(dataset)

let sampleView = makeArrayView(280)
let selectedSample = dataset.test[0]

function selectSample(sample){
    selectedSample = sample
    sampleView.setArray(sample.label,sample.img,MNIST_SIZE)
    let brd = imgBorder(sample.img)
    console.log(brd)
}
selectSample(selectedSample)
let sampleSelector = makeSampleSelector(["train","test"],dataset,(sample)=>selectSample(sample))


let main = makehbox([
    makevbox([
        sampleView.html,
        sampleSelector.html,
    ])
])

main.style = "gap: 20px; height:100%"
document.body.appendChild(main)

})