readMNIST().then(dataset=>{

document.getElementById("loading").remove()

console.log(dataset)

let snn_size = 10
let hiddenSize = snn_size*snn_size
let learnRate = 0.001

let periodInput = new PeriodicFireInput(MNIST_SIZE*MNIST_SIZE)
let excSynapse = new LearningSynapse(MNIST_SIZE*MNIST_SIZE,hiddenSize,10,100,randMatrix(MNIST_SIZE*MNIST_SIZE,hiddenSize,0,0.04),
learnRate,learnRate,1,4,30,0.2)
let inhibitOther = new InhibitOthers(hiddenSize)
let inhSynapse = new Synapse(hiddenSize,hiddenSize,5,-40,sameMatrix(hiddenSize,hiddenSize,0.2))
let lifLayer = new LIFLayer([excSynapse,inhSynapse],hiddenSize,20,0,40)
let neuronVotes = new Array(hiddenSize).fill(0).map(()=>new Array(10).fill(0))

let input_fields = [
    makeInput("learning_rate",0.001,(val)=>learnRate=val),
    makeInput("x_tar",4,(val)=>excSynapse.x_tar=val),
    makeInput("w_max",0.2,(val)=>excSynapse.w_max=val),
    makeInput("exc_tau",10,(val)=>excSynapse.tau=val),
    makeInput("x_tau",30,(val)=>excSynapse.x_tau=val),
    makeInput("inh_tau",5,(val)=>inhSynapse.tau=val),
    makeInput("lif_tau",20,(val)=>lifLayer.tau=val),
    makeInput("exc_v",100,(val)=>excSynapse.eqv=val),
    makeInput("inh_v",-40,(val)=>inhSynapse.eqv=val),
    makeInput("v_thres",40,(val)=>lifLayer.vt=val)
]

periodInput.outputs = [excSynapse]
inhibitOther.outputs = [inhSynapse]
lifLayer.outputs = [inhibitOther]

let snn = new SNN([periodInput,lifLayer,inhibitOther])

let upscaleRate = 1.5
function sample2rate(s){
    return s/1024*upscaleRate
}

let main = makehbox()
main.style = "gap: 20px; height:100%"
document.body.appendChild(main)

let sampleDiv = makevbox()
main.appendChild(sampleDiv)

let sampleView = makeArrayView(280)
sampleDiv.appendChild(sampleView.html)

let selectedSample = dataset.test[0]

function selectSample(sample){
    selectedSample = sample
    sampleView.setArray(sample.label,sample.img,MNIST_SIZE)
    periodInput.setFireRates(selectedSample.img.map((v)=>sample2rate(v)))
}

selectSample(selectedSample)

let sampleSelector = makeSampleSelector(["test","train"],dataset,(sample)=>selectSample(sample))
sampleDiv.appendChild(sampleSelector.html)


let views = makevbox()
let smallViews = makehbox()

let lifView = makeArrayView(280)
smallViews.appendChild(lifView.html)
let excView = makeArrayView(280)
smallViews.appendChild(excView.html)
let inhView = makeArrayView(280)
smallViews.appendChild(inhView.html)
views.appendChild(smallViews)
main.appendChild(views)

let weightsView = makeArrayView(840)
views.appendChild(weightsView.html)
weightsView.html.style = "width:50%"
let visualize = true
let runMode = "normal"

let statusText = makeh()
let upscaleText = makeh("0")
let visCheck = maketoggle(visualize,(val)=>visualize = val)

let votesText = [...Array(10).keys()].map((v)=>makeh(v+"[0]"))

let resetWeights = makeButton("RESET WEIGHTS",()=>{
    excSynapse.weights = randMatrix(MNIST_SIZE*MNIST_SIZE,hiddenSize,0,0.04)
})

let resetVotes = makeButton("RESET VOTES",()=>{
    neuronVotes = new Array(hiddenSize).fill(0).map(()=>new Array(10).fill(0))
})

function normalStep(){
    excSynapse.ll_post = 0
    excSynapse.ll_pre = 0
    snn.run_step()
    if(visualize){
        lifView.setArray("LIF",(lifLayer.volts).map(v=>v*3),snn_size)
        excView.setArray("EXC",(lifLayer.synapses[0].flows).map(v=>v*50),snn_size)
        inhView.setArray("INH",(lifLayer.synapses[1].flows).map(v=>v*200),snn_size)
        weightsView.setArray("WEIGHTS",weights2map(excSynapse.weights,MNIST_SIZE,snn_size).map(v=>v*3000),MNIST_SIZE*snn_size)
    }
}

function autoTrain(){
    sampleSelector.selectNext()
    for(let i=0; i<1; i++){
        upscaleRate = 1+0.1*i
        upscaleText.innerHTML=upscaleRate
        periodInput.setFireRates(selectedSample.img.map((v)=>sample2rate(v)))
        excSynapse.ll_post = learnRate
        excSynapse.ll_pre = learnRate
        let fireCounts = new Array(hiddenSize).fill(0)
        for(let i=0; i<100; i++){
            let spks = snn.run_step()[1]
            for(let i=0; i<hiddenSize; i++){
                fireCounts[i]+=spks[i]
            }
        }
        if(visualize){
            lifView.setArray("fireCounts",fireCounts.map(v=>v*10),snn_size)
            weightsView.setArray("WEIGHTS",weights2map(excSynapse.weights,MNIST_SIZE,snn_size).map(v=>v*3000),MNIST_SIZE*snn_size)
        }
        let digitVote = new Array(10).fill(0)
        if(visualize){
            for(let i=0; i<hiddenSize; i++){
                if(fireCounts[i]>0){
                    weightsView.drawFrame(i%10,Math.floor(i/10),snn_size)
                }
            }
        }
        for(let i=0; i<hiddenSize; i++){
            let mx = 0
            let mxj = 0
            for(let j=0; j<10; j++){
                if(neuronVotes[i][j]>mx){
                    mx = neuronVotes[i][j]
                    mxj = j
                }
            }
            digitVote[mxj]+=fireCounts[i]
        }

        for(let i=0; i<10; i++){
            votesText[i].innerHTML = i+"["+digitVote[i]+"]"
            if(digitVote[i]>0){
                votesText[i].style = "font-weight: bold;"
            }else{
                votesText[i].style = "font-weight: normal;"
            }
        }
        let totalFired = 0
        for(let i=0; i<hiddenSize; i++){
            neuronVotes[i][selectedSample.label]+=fireCounts[i]
            totalFired+=fireCounts[i]
        }
        if(totalFired>0) break;
    }
}

function autoTest(){

}

function step(){
    switch(runMode){
        case "normal":
            normalStep()
            break
        case "train":
            autoTrain()
            break
        case "test":
            autoTest()
            break
    }
}

let inprogress = false
function animate(){
    if(inprogress) step()
    requestAnimationFrame(animate)
}

requestAnimationFrame(animate)

function setstatus(){
    statusText.innerHTML = runMode+" "+(inprogress?"running":"stopped")
}

setstatus()

let startBtn = makeButton("start",()=>{inprogress=true; setstatus()})
let stopBtn = makeButton("stop",()=>{inprogress=false; setstatus()})
let stepBtn = makeButton("step",()=>step())

let btnContainer = makehbox()
btnContainer.appendChild(startBtn)
btnContainer.appendChild(stopBtn)
btnContainer.appendChild(stepBtn)
sampleDiv.appendChild(btnContainer)

let normalBtn = makeButton("normal",()=>{runMode="normal"; setstatus()})
let trainBtn = makeButton("train",()=>{runMode="train"; setstatus()})
let testBtn = makeButton("test",()=>{runMode="test"; setstatus()})

let modeContainer = makehbox()
modeContainer.appendChild(normalBtn)
modeContainer.appendChild(trainBtn)
modeContainer.appendChild(testBtn)
sampleDiv.appendChild(modeContainer)

let statusContainer = makehbox()
statusContainer.appendChild(statusText)
statusContainer.appendChild(visCheck)
sampleDiv.appendChild(statusContainer)

let votesContainer = makehbox()
votesText.forEach((elem)=>votesContainer.appendChild(elem))
// votesContainer.appendChild(upscaleText)
views.appendChild(votesContainer)

let settingsContainer = makevbox()
input_fields.forEach((elem)=>settingsContainer.appendChild(elem))
sampleDiv.appendChild(settingsContainer)
sampleDiv.appendChild(resetVotes)
sampleDiv.appendChild(resetWeights)
})