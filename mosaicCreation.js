import { average, drawImage, predominant } from "./calculations.js";
import { invalidIDS } from "./invalidRandomID.js";
import { getPath, progressBarGen, loadImage, getImageData, canvas, ctx } from "./tools.js";

/**
 * 
 * @param {boolean} random Use random photos
 * @param {number} maxValue Maximum number of photos used
 * @param {(id: number) => string} searchFn function that returns the string with the path
 * @param {(path: string) => Promise<[number, number, number]} propertyFn Function that does calculation with pixels 
 * @returns 
 */

const calculatePhotoProperty = async(random, maxValue, searchFn, propertyFn) =>{
    const {progressFn, endFn} = progressBarGen(maxValue, "fotos cargadas.");
    const promises = Array(maxValue);

    for(let i = 0; i < maxValue; i++){
        if(random && invalidIDS.includes(i)) promises[i] = new Promise((rs) => rs([null, null, null]));
        else promises[i] = propertyFn(searchFn(i));
        promises[i].finally(progressFn);
    }
    
    const calculations = await Promise.all(promises);
    const imgPath = {};
    calculations.forEach((val, idx) =>imgPath[val] = searchFn(idx))
    endFn();
    return [calculations.filter(arra => !arra.includes(null)), imgPath];
}

/**
 * @param {number | string[]} photos use a number if you need random photos, else use array with paths of photos. 
 * @param {boolean} useAverage if true (default) average function is used, else is used predominant.
 * @param {number} w width of the random photo needed to calculate the average and then for resolution of "mosaic pixel".
 * @param {number} h height of random photo, default is squared. 
 * @returns 
 */
const getPhotoProperty = async(photos, useAverage = true, w, h = w) =>{
    const random = typeof photos === "number";
    const maxValue = random ? photos : photos.length;
    const searchFn =  random ? (id) => getPath(id, w, h) : (id) => photos[id];
    const propertyFn = useAverage ? average : predominant;
    
    return calculatePhotoProperty(random, maxValue, searchFn, propertyFn);
}


const createMosaic = async(path, calculations, imgPaths, fragX, fragY = fragX) =>{
    let data;
    try{
        data= (await getImageData(path, fragX, fragY)).data;
    }catch(e){
        console.log(e)
    }
    const tree = d3.octree().addAll(calculations);
    const memo = {};
    const memo2 = {};
    const promises = [];
    const {progressFn, endFn} = progressBarGen(data.length * 0.25, "píxeles calculados.");
    for(let i = 0; i<data.length; i+=4){
        const promiseImage = drawImage(data.slice(i, i+3), memo, memo2, imgPaths, tree);
        promiseImage.finally(progressFn)
        promises.push(promiseImage);
    }
    let result = [];
    for(let i = 0; i<promises.length; i+=5e5){
        result = result.concat(await Promise.all(promises.slice(i, i + 5e5)));
    }
    endFn();
    return result;
}

const reduceNumOfPixels = (mosaic, prevNumOfFrag, numberOfFragments, ratio) =>{
    const h = canvas.height;
    const w = h * ratio;
    const numRatio = prevNumOfFrag / numberOfFragments;
    const pixelH = h / numRatio;
    const pixelW = w / numRatio;
    const reducedMosaic = [];
    for(let i = 0; i<numberOfFragments; i++){
        for(let j = 0; j < numberOfFragments; j++){
            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d");
            tempCanvas.width = w, tempCanvas.height = h;
            for(let x = 0; x < numRatio; x++){
                for(let y = 0; y < numRatio; y++){
                    const index = (x + i * numRatio) + (y + j * numRatio) * prevNumOfFrag;
                    tempCtx.drawImage(mosaic[index], x * pixelW, y * pixelH, pixelW, pixelH);
                }
            }
            
            reducedMosaic[i + numberOfFragments * j] = tempCanvas;
        }
    }
    return reducedMosaic;
}

export const generateMosaic = async(path, photos, sizeOfPixelImg, numberOfFragments, useAverage = true) =>{ 
    const original = await loadImage(path);
    const ratio = original.width / original.height;
    document.body.append(original);
    const [calculations, imgPaths] = await getPhotoProperty(photos, useAverage, sizeOfPixelImg);
    const completeMosaic = await createMosaic(path, calculations, imgPaths, numberOfFragments);
    const reducedMosaic = reduceNumOfPixels(completeMosaic, numberOfFragments, numberOfFragments / 10, ratio)
    return [{mosaic: completeMosaic, fragments: numberOfFragments}, {mosaic:reducedMosaic, fragments: numberOfFragments / 10}]
}

export const changeMosaicSize = (mosaics, posX = 0, posY = 0, w = innerHeight, h =innerHeight) =>{
    ctx.fillStyle ="grey"
    ctx.fillRect(0,0, canvas.width, canvas.height)
    const {mosaic, fragments} = mosaics[0];
    const pixelW = Math.max(1, w / fragments);
    const pixelH = Math.max(1, h / fragments);
    const initialI = Math.max(0, posX), initialJ = Math.max(0, posY);
    const endI = w + posX;
    const endJ = h + posY;
    let i = initialI, j = initialJ;
    while(i < canvas.width && i < endI){
            while(j < canvas.height && j < endJ){
            const index = Math.round((i - posX)/pixelW) + Math.round((j - posY)/pixelH) * fragments;
            if(mosaic[index]) ctx.drawImage(mosaic[index], i, j, pixelW, pixelH);
            j+= pixelH;
        }
        j = initialJ;
        i+= pixelW;
    }
}