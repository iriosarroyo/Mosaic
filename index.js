import { loadImage, $, canvas,ctx, getImageData, sleep, getPath } from "./tools.js";
import "https://unpkg.com/d3-octree";
import { changeMosaicSize, generateMosaic } from "./mosaicCreation.js";
import { average } from "./calculations.js";

const id = 237;
const width = 200;
const height = 200;
let size;
const globalPath = getPath(id, width, height);
let mosaic, mosaicFragmentsX, mosaicFragmentsY, ratio = 1;
//let globalPath;
const filePicker = $(".filePicker")
const folderPicker = $(".folderPicker");
const loader = $(".loader");
const msgLoader = $(".msg", loader);
const percLoader = $(".percentage", loader);






canvas.width = innerWidth, canvas.height = innerHeight;
let gPosX, gPosY;

let lastImage, lastX, lastY;
const selectHandler = (e) =>{
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    if(lastImage) ctx.putImageData(lastImage, lastX, lastY);
    const h = size * canvas.height;
    const w = h * ratio;
    const pixelW = w / mosaicFragmentsX;
    const pixelH = h / mosaicFragmentsY;
    const x = Math.floor((mouseX-gPosX)/w * mosaicFragmentsX + (gPosX/w * mosaicFragmentsX) % 1) + Math.trunc(gPosX/w * mosaicFragmentsX);
    const y = Math.floor((mouseY-gPosY)/h * mosaicFragmentsY + (gPosY/h * mosaicFragmentsY) % 1) + Math.trunc(gPosY/h * mosaicFragmentsY);
    lastImage = ctx.getImageData(x * pixelW, y * pixelH, pixelW + 2, pixelH + 2)
    ctx.fillStyle = "#00dd0055"
    ctx.lineWidth = 0
    ctx.fillRect(x * pixelW, y * pixelH, pixelW, pixelH)
    lastX = x * pixelW;
    lastY = y * pixelH;
}



/* canvas.addEventListener("mousedown", () =>{
    canvas.removeEventListener("mousemove", selectHandler);
    const moveHandler = (e)=>{
        const h = size * canvas.height;
        const w = h * ratio;
        const {movementX, movementY} = e;
        lastImage = undefined;
        changeMosaicSize(movementX + gPosX, movementY + gPosY, w, h)
    }
    const mouseUpHandler = () =>{
        canvas.removeEventListener("mousemove", moveHandler);
        canvas.addEventListener("mousemove", selectHandler);
        removeEventListener("mouseup", mouseUpHandler);
    }
    canvas.addEventListener("mousemove", moveHandler)
    addEventListener("mouseup", mouseUpHandler)
}) */

canvas.addEventListener("wheel", async(e) =>{
    e.preventDefault();
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    let factor = 1;
    if(e.deltaY !== 0) factor = 0.95 ** (e.deltaY / Math.abs(e.deltaY));
    size *= factor;
    let h = size * canvas.height;
    let w = h * ratio;
    
    let posX;
    let posY;
    if(w < canvas.width) posX = (canvas.width - w)/2;
    else{
        const distanceToLeft = (mouseX - gPosX) * factor;
        posX = - distanceToLeft + mouseX;
    }
    if(h < canvas.height) posY = (canvas.height - h)/2;
    else{
        const distanceToLeft = (mouseY - gPosY) * factor;
        posY = - distanceToLeft + mouseY;
    }
    changeMosaicSize(mosaic, 0, 0, w, h);
    lastImage = undefined;
})

window.addEventListener("load", async()=>{
    mosaic = await generateMosaic(globalPath, 100, 250, width/2);
    changeMosaicSize(mosaic, 0, 0, canvas.height, canvas.height);
    size = 1;
    //canvas.addEventListener("mousemove", selectHandler);

})

addEventListener("keydown", async(e) =>{
    let number = parseInt(e.code.replace("Digit", ""));
    if(e.shiftKey) number = - number;
    if(Number.isNaN(number)) return;
    changeMosaicSize(number * canvas.height / mosaicFragmentsX, number * canvas.height / mosaicFragmentsY, canvas.height, canvas.height)
})

let insertedFile, img;
filePicker.addEventListener("change", async(e)=>{
    const [file] = e.target.files;
    insertedFile = URL.createObjectURL(file)
    img = await loadImage(insertedFile);
    ratio = img.width / img.height
    document.body.append(img);
})

folderPicker.addEventListener("change", async(e) =>{
    if(!insertedFile) return;
    try{
        const maxValue = e.target.files.length
        loader.style.display = "block";
        percLoader.max = maxValue;
        const paths = [...e.target.files].map((file) => URL.createObjectURL(file)); 
    
    /*let aveCalculated = 0;
    const promises = [...e.target.files].map((file, i) => {
        paths.push(URL.createObjectURL(file))
        return average(paths[i]).finally((val)=>{
            percLoader.value = (++aveCalculated);
            msgLoader.textContent = `${aveCalculated} de ${maxValue} medias calculadas`
            return val;
        });
    });
     while(aveCalculated < maxValue) await sleep(100);
    const averages = await Promise.all(promises);
    loader.style.display = "block";
    const imgPath = {}
    averages.forEach((val, idx) => imgPath[val] = paths[idx]);  */
    mosaic = await generateMosaic(insertedFile, paths, 250, width/2);
    changeMosaicSize(mosaic, 0, 0, canvas.height, canvas.height);
}catch(e){
    console.log(e)
}
})
