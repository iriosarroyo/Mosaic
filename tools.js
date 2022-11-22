/**
 * 
 * @param {import("./types").tagKeys} query 
 * @returns 
 */
export const $ = (query, element = document) => element.querySelector(query);
/**
 * @type {HTMLCanvasElement}
 */

export const canvas = $(".mosaic");
/**
 * @type {CanvasRenderingContext2D}
 */
export const ctx = canvas.getContext("2d");

export const intBtn = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
/**
 * 
 * @param {string} path 
 * @returns {Promise<HTMLImageElement>}
 */
export const loadImage = (path) => new Promise((rs, rj) =>{
    const image = new Image();
    image.src = path;
    image.crossOrigin = "Anonymous";
    image.addEventListener("load", () =>{
       /*  const tempCanvas = document.createElement("canvas");
        const tempContext = tempCanvas.getContext("2d");
        tempCanvas.width = image.width, tempCanvas.height = image.height;
        tempContext.drawImage(image, 0, 0);
        rs(tempCanvas.transferControlToOffscreen()) */
        rs(image)
    });
    image.addEventListener("error", rj);
});

/**
 * 
 * @param {string} path 
 * @returns {Promise<ImageData>}
 */
export const getImageData = async (path, w, h = w) =>{
    const image = await loadImage(path);
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w ?? image.width, tempCanvas.height  =  h ?? image.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);
    return tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
}


export const sleep = async(ms) =>new Promise(rs => setTimeout(rs, ms));

export const getPath = (id, w, h) =>{
    return `https://picsum.photos/id/${id}/${w}/${h}`
}

export const getImageBitmap = async(path) =>{
    const blob = await fetch(path).then(result => result.blob());
    return createImageBitmap(blob);
}

const loader = $(".loader");
const msgLoader = $(".msg", loader);
const percLoader = $(".percentage", loader);
export const progressBarGen = (maxValue, text = `cargado.`) =>{
    loader.style.display = "block";
    percLoader.max = maxValue;
    let calculated = 0;
    return {
        progressFn: (val)=>{
            percLoader.value = (++calculated);
            msgLoader.textContent = `${calculated} de ${maxValue} ${text}`
            return val;
        }, 
        endFn: (val) => (loader.style.display = "none", val)
    }
}