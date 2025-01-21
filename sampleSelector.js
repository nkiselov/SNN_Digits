function makeSampleSelector(propList,dataset,callback){
    let container = document.createElement("div")
    let dropdown = document.createElement("select")
    let number = document.createElement("input")

    number.type = "number"
    number.style = "width: 80px;"
    container.className = 'hbox'
    container.style = 'align-items: center;'
    container.appendChild(dropdown)
    container.appendChild(number)

    propList.forEach((prop)=>{
        let opt = document.createElement("option")
        opt.value = prop
        opt.innerHTML = prop
        dropdown.appendChild(opt)
    })

    let selectedProp = null
    function selectNum(){
        number.value = Math.min(number.value,number.max)
        number.value = Math.max(number.value,number.min)
        callback(dataset[selectedProp][parseInt(number.value)])
    }

    function selectProp(){
        selectedProp = propList[dropdown.selectedIndex]
        number.min = 0
        number.max = dataset[selectedProp].length-1
        selectNum()
    }
    selectProp()
    dropdown.onchange = selectProp
    number.onchange = selectNum
    return {
        html: container,
        selectNext: ()=>{
            number.value=parseInt(number.value)+1
            selectNum()
        }
    }
}