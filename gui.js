function makeButton(label, onclick){
    let button = document.createElement("button")
    button.onclick = onclick
    button.innerHTML = label
    return button
}

function makehbox(){
    let hbox = document.createElement("div")
    hbox.className = "hbox"
    return hbox
}

function makevbox(){
    let vbox = document.createElement("div")
    vbox.className = "vbox"
    return vbox
}

function makeh(text){
    let h = document.createElement("h")
    h.innerHTML = text
    return h
}

function maketoggle(checked, onchange){
    let tog = document.createElement("input")
    tog.type = "checkbox"
    tog.checked = checked
    tog.onchange = ()=>onchange(tog.checked)
    return tog
}

function makeInput(label,value,onchange){
    let inp = document.createElement("input")
    inp.type = "number"
    inp.value = value
    inp.onchange = ()=>onchange(parseFloat(inp.value))
    let text = document.createElement("h")
    text.innerHTML=label
    let cont = document.createElement("div")
    cont.className = "hbox"
    cont.appendChild(text)
    cont.appendChild(inp)
    return cont
}