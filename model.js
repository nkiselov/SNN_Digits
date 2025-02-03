async function readModel(){
    fetch('')
    .then(res => res.blob())
    .then(blob => {
        console.log(blob)
    });
    return await fetch("./mnist_400.json").then(res=>res.json())
}
