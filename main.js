readMNIST().then(dataset=>{

document.getElementById("loading").remove()

console.log(dataset)

let snn_size = 30
let hiddenSize = snn_size*snn_size
let learnRate = 0.0002

let periodInput = new PeriodicFireInput(MNIST_SIZE*MNIST_SIZE)
let excSynapse = new LearningSynapse(MNIST_SIZE*MNIST_SIZE,hiddenSize,10,100,randMatrix(MNIST_SIZE*MNIST_SIZE,hiddenSize,0,0.1),
learnRate,learnRate,1,3,30,0.4,6,0.5)
let inhibitOther = new InhibitOthers(hiddenSize)
let inhSynapse = new Synapse(hiddenSize,hiddenSize,10,-40,eyeMatrix(hiddenSize,4))
let lifLayer = new LIFLayer([excSynapse,inhSynapse],hiddenSize,20,0,40,0.2,100000)
let neuronVotes = new Array(hiddenSize).fill(0).map(()=>new Array(10).fill(0))

periodInput.outputs = [excSynapse]
inhibitOther.outputs = [inhSynapse]
lifLayer.outputs = [inhibitOther]

let snn = new SNN([periodInput,lifLayer,inhibitOther])

let sampleView = makeArrayView(280)
let debugViews = Array(5).fill(0).map(v=>makeArrayView(280))
let weightsView = makeArrayView(560)

let selectedSample = dataset.test[0]
function selectSample(sample){
    selectedSample = sample
    sampleView.setArray(sample.label,sample.img,MNIST_SIZE)
}
selectSample(selectedSample)
let sampleSelector = makeSampleSelector(["train","test"],dataset,(sample)=>selectSample(sample))


let visualize = true
let learning = true
let visCheck = maketoggle(visualize,(val)=>visualize = val)
let learnCheck = maketoggle(learning,(val)=>learning = val)
let votesText = [...Array(10).keys()].map((v)=>makeh(v+"[0]"))

let upscaleRate = 1.0
function sample2rate(s){
    // let sm = sumArr(s)
    return s.map(v=>v*upscaleRate/1024)
}

function getNeuronClass(){
    let classes = new Array(hiddenSize)
    for(let i=0; i<hiddenSize; i++){
        let mx = 0
        let mxj = 0
        for(let j=0; j<10; j++){
            if(neuronVotes[i][j]>mx){
                mx = neuronVotes[i][j]
                mxj = j
            }
        }
        classes[i] = mxj
    }
    return classes
}

let respMatrix = new Array(10).fill(0).map(v=>new Array(10).fill(0))
let cwtexts = [...Array(11).keys()].map((v)=>makeh(v+": 0% 0 - 0"))

let sumFireCounts = new Array(hiddenSize).fill(0)
function autoTrain(){
    sampleSelector.selectNext()

    for(let i=0; i<4; i++){
        upscaleRate = 1.0+0.15*i

        periodInput.setFireRates(sample2rate(selectedSample.img))
        if(learning){
            excSynapse.ll_post = learnRate
            excSynapse.ll_pre = learnRate
        }else{
            excSynapse.ll_post = 0
            excSynapse.ll_pre = 0
        }
        
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
        addArr(sumFireCounts,fireCounts)
        let outputSpikes = sumArr(fireCounts)
        if(outputSpikes<10) continue;

        if(visualize){
            debugViews[0].setArray("FIRE_COUNTS",fireCounts.map(v=>v*10),snn_size)
            debugViews[1].setArray("ACTIVITY",normalize(sumFireCounts),snn_size)
            debugViews[2].setArray("HOMEOSTASIS",lifLayer.hemv,snn_size)
            debugViews[4].setArray("WEIGHT SUM",normalize(excSynapse.w_sums),snn_size)
            weightsView.setArray("WEIGHTS",weights2map(excSynapse.weights,MNIST_SIZE,snn_size).map(v=>v*1000),MNIST_SIZE*snn_size)
        }
        let digitVote = new Array(10).fill(0)
        if(visualize){
            for(let i=0; i<hiddenSize; i++){
                if(fireCounts[i]>0){
                    weightsView.drawFrame(i%snn_size,Math.floor(i/snn_size),snn_size)
                }
            }
        }
        for(let i=0; i<hiddenSize; i++){
            let sm = sumArr(neuronVotes[i])
            for(let j=0; j<10; j++){
                if(fireCounts[i]>0)
                digitVote[j]+=fireCounts[i]*Math.log((neuronVotes[i][j]+1)/(sm+10))
            }
        }
        let mxVote = -Infinity
        let mxInd = 0
        for(let i=0; i<10; i++){
            if(digitVote[i]>mxVote){
                mxInd = i
                mxVote = digitVote[i]
            }
            votesText[i].innerHTML = i+"["+digitVote[i].toFixed(2)+"]"
            votesText[i].style = "font-weight: normal;"
        }
        votesText[mxInd].style = "font-weight: bold;"
        respMatrix[selectedSample.label][mxInd]+=1
        let correctSum = 0
        let wrongSum = 0
        for(let i=0; i<10; i++){
            let correct = respMatrix[i][i]
            let wrong = sumArr(respMatrix[i])-correct
            correctSum+=correct
            wrongSum+=wrong
            cwtexts[i].innerHTML = i+": "+(100*correct/(correct+wrong)).toFixed(1)+"% "+correct+" - "+wrong
        }
        cwtexts[10].innerHTML = (100*correctSum/(correctSum+wrongSum)).toFixed(1)+"% "+correctSum+" - "+wrongSum
        if(visualize){
            debugViews[3].setArray("ACCURACY",normalize(respMatrix.flat()),10)
        }
        for(let i=0; i<hiddenSize; i++){
            neuronVotes[i][selectedSample.label]+=fireCounts[i]
        }
        console.log(selectedSample.label,inputSpikes,outputSpikes)
        break
    }
}

function step(){
    autoTrain()
}

let inprogress = false
function animate(){
    if(inprogress) step()
    requestAnimationFrame(animate)
}

requestAnimationFrame(animate)



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
    makeInput("v_thres",40,(val)=>lifLayer.vt=val),
    makeInput("spike_rate",10,(val)=>spikeRate=val)
]

let main = makehbox([
    makevbox([
        sampleView.html,
        sampleSelector.html,
        makehbox([
            makeButton("start",()=>{inprogress=true;}),
            makeButton("stop",()=>{inprogress=false;}),
            makeButton("step",()=>step())
        ]),
        makehbox([makeh("Visualize "),visCheck]),
        makehbox([makeh("Learn "),learnCheck]),
        makeButton("RESET NEURONS",()=>{
            excSynapse.forget()
            inhSynapse.forget()
            lifLayer.forget()
            sumFireCounts = new Array(hiddenSize).fill(0)
            excSynapse.setWeights(randMatrix(MNIST_SIZE*MNIST_SIZE,hiddenSize,0,0.04))
        }),
        makeButton("RESET VOTES",()=>{
            neuronVotes = new Array(hiddenSize).fill(0).map(()=>new Array(10).fill(0))
        }),
        makeButton("DOWNLOAD",()=>{
            let saveData = (function () {
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                return function (data, fileName) {
                    var blob = new Blob([data], {type: "octet/stream"}),
                        url = window.URL.createObjectURL(blob);
                    a.href = url;
                    a.download = fileName;
                    a.click();
                    window.URL.revokeObjectURL(url);
                };
            }());
    
            saveData(JSON.stringify({
                neurons: neuronVotes,
                weights: excSynapse.weights,
            }),"mnist_"+hiddenSize+".json")
        }),
        makeButton("RESET CW", ()=> {
            respMatrix = new Array(10).fill(0).map(v=>new Array(10).fill(0))
        }),
        makeButton("PRINT NEURON", ()=>{
            let cls = getNeuronClass()
            let counts = new Map()
            cls.forEach(num=>counts[num] = counts[num] ? counts[num] + 1 : 1)
            console.log(cls)
            console.log(neuronVotes)
            console.log(counts)
            let fireCounts = new Map()
            let neuronFireCounts = neuronVotes.map(arr=>sumArr(arr))
            for(let i=0; i<hiddenSize; i++){
                fireCounts[cls[i]] = fireCounts[cls[i]] ? fireCounts[cls[i]]+neuronFireCounts[i]/counts[cls[i]] : neuronFireCounts[i]/counts[cls[i]]
            }
            console.log(fireCounts)
            let weightSum = new Array(hiddenSize).fill(0)
            for(let i=0; i<MNIST_SIZE*MNIST_SIZE; i++){
                for(let j=0; j<hiddenSize; j++){
                    weightSum[j]+=excSynapse.weights[i][j]
                }
            }
            debugViews[4].setArray("WEIGHT SUM",normalize(weightSum),snn_size)
        }),
        makeFileInput("LOAD",(model)=>{
            excSynapse.setWeights(model.weights)
            neuronVotes = model.neurons
            lifLayer.hemv = new Array(hiddenSize).fill(8)
        }),
        ...cwtexts,
    ]),
    makevbox([
        makehbox([...debugViews.map(v=>v.html)]),
        makehbox([weightsView.html]),
        makehbox([...votesText])
    ]),
])

main.style = "gap: 20px; height:100%"
document.body.appendChild(main)

})