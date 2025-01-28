function makeButton(label, onclick){
    let button = document.createElement("button")
    button.onclick = onclick
    button.innerHTML = label
    return button
}

function makehbox(elems){
    let hbox = document.createElement("div")
    hbox.className = "hbox"
    elems.forEach((e)=>hbox.appendChild(e))
    return hbox
}

function makevbox(elems){
    let vbox = document.createElement("div")
    vbox.className = "vbox"
    elems.forEach((e)=>vbox.appendChild(e))
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

function makeFileInput(label,onfile){
    let inp = document.createElement("input")
    inp.type = "file"
    inp.style = "display: none"
    inp.accept = ".json"
    inp.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    onfile(JSON.parse(e.target.result))
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    alert('Error parsing JSON file. Please make sure it\'s a valid JSON file.');
                }
            };

            reader.onerror = function(e) {
                console.error('Error reading file:', e);
                alert('Error reading file');
            };

            reader.readAsText(file);
        }
    });
    let btn = makeButton(label,()=>inp.click())
    return btn
}