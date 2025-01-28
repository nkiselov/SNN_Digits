readModel().then(model=>{

document.getElementById("loading").remove()

let snn_size = 30
let hiddenSize = snn_size*snn_size

let periodInput = new PeriodicFireInput(MNIST_SIZE*MNIST_SIZE)
let excSynapse = new Synapse(MNIST_SIZE*MNIST_SIZE,hiddenSize,10,100,model.weights)
let inhibitOther = new InhibitOthers(hiddenSize)
let inhSynapse = new Synapse(hiddenSize,hiddenSize,10,-40,eyeMatrix(hiddenSize,4))
let lifLayer = new LIFLayer([excSynapse,inhSynapse],hiddenSize,20,0,40,0.2,100000)
let neuronVotes = model.neurons

periodInput.outputs = [excSynapse]
inhibitOther.outputs = [inhSynapse]
lifLayer.outputs = [inhibitOther]

let snn = new SNN([periodInput,lifLayer,inhibitOther])

let sampleArr = new Array(MNIST_SIZE*MNIST_SIZE).fill(0)
let sampleView = makeArrayView(280)
function renderSampleView(){
    sampleView.setArray("",sampleArr.map(v=>v*255),MNIST_SIZE)
}
renderSampleView()

makeMouser(sampleView.html,(x0,y0)=>{
    x0*=MNIST_SIZE
    y0*=MNIST_SIZE
    for(let x=0; x<MNIST_SIZE; x++){
        for(let y=0; y<MNIST_SIZE; y++){
            let d = Math.sqrt((x-x0)*(x-x0)+(y-y0)*(y-y0))
            let dw = Math.max(0,1.2-d)
            sampleArr[y*MNIST_SIZE+x]=Math.min(1,sampleArr[y*MNIST_SIZE+x]+dw)
        }
    }
    renderSampleView()
})

let upscaleRate = 1.0
function sample2rate(s){
    return s.map(v=>v*upscaleRate/4)
}

let votesText = [...Array(10).keys()].map((v)=>makeh(v+"[0]"))

function runNet(){
    for(let i=0; i<4; i++){
        upscaleRate = 1.0+0.15*i

        periodInput.setFireRates(sample2rate(sampleArr))
        lifLayer.hemv = new Array(hiddenSize).fill(8)

        excSynapse.relax()
        inhSynapse.relax()
        lifLayer.relax()

        let inputSpikes = 0
        let fireCounts = new Array(hiddenSize).fill(0)
        for(let i=0; i<100; i++){
            let spks = snn.run_step()
            inputSpikes+=sumArr(spks[0])
            addArr(fireCounts,spks[1])
        }

        let outputSpikes = sumArr(fireCounts)
        if(outputSpikes<10) continue;

        let digitVote = new Array(10).fill(0)

        for(let i=0; i<hiddenSize; i++){
            let sm = sumArr(neuronVotes[i])
            for(let j=0; j<10; j++){
                if(fireCounts[i]>0)
                digitVote[j]+=fireCounts[i]*Math.log((neuronVotes[i][j]+1)/(sm+10))
            }
        }

        let votes = [...Array(10).keys()].map(i=>[i,digitVote[i]])
        votes.sort((a, b) => b[1] - a[1])
        votesText[0].style = "font-weight: bold;"
        for(let i=0; i<10; i++){
            votesText[i].innerHTML = votes[i][0]+"["+votes[i][1].toFixed(2)+"]"
        }
        console.log(inputSpikes,outputSpikes)
        break
    }
}

setInterval(runNet,50)

let main = makehbox([
    makevbox([makeh("DIGIT CLASSIFIER"),sampleView.html,
        makeButton("RESET",()=>{
            sampleArr = new Array(MNIST_SIZE*MNIST_SIZE).fill(0)
            renderSampleView()
        })]),
    makevbox([...votesText])
])

main.style = "gap: 20px; height:100%"
document.body.appendChild(main)

})