function makeArrayView(size){
    let container = document.createElement("div")
    let label = document.createElement("h")
    let canvas = document.createElement("canvas")

    container.className = 'vbox'
    container.style = 'align-items: center;'
    container.appendChild(canvas)
    container.appendChild(label)

    label.style = "font-size: x-large"

    canvas.width = size
    canvas.height = size

    let ctx = canvas.getContext('2d')

    return {
        html: container,
        setArray: (text,arr,asize)=>{
            label.innerHTML = text
            let cellSize = size/asize
            for(let x=0; x<asize; x++){
                for(let y=0; y<asize; y++){
                    let val = arr[y*asize+x]
                    ctx.fillStyle = `rgb(
                        ${val}
                        ${val}
                        ${val})`
                    ctx.fillRect(cellSize*x,cellSize*y,cellSize,cellSize)
                }
            }
        }
    }
}