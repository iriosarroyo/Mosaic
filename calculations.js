import { getImageData, loadImage } from "./tools.js";
import ColorThief from './node_modules/colorthief/dist/color-thief.mjs'
import "https://unpkg.com/d3-octree";


/**
 * 
 * @param {string} path image url;
 * @returns {Promise<[number, number, number]>} Promise with red, green and blue
 */
 export const average = async (path) =>{
    let data;
    try{
        data = (await getImageData(path)).data;
    }catch(e){
        return [null, null, null]
    }
    let red = 0, green = 0, blue = 0;
    for(let i = 0; i<data.length; i+=4){
        const [r, g, b] = data.slice(i, i + 3);
        red += r;
        green += g;
        blue += b;
    }
    const result = [red, green, blue].map(x => x/data.length * 4)
    return result;
}

/**
 * 
 * @param {string} path image url;
 * @returns {Promise<[number, number, number]>} Promise with red, green and blue
 */

export const predominant = async (path) =>{
    let img;
    try{
        img = await loadImage(path)
    }catch(e){
        return [null, null, null]
    }
    
    const colorThief = new ColorThief();
    const result = colorThief.getColor(img);
    return result;
}

/**
 * 
 * @param {[number, number, number]} pixelColor rgb array
 * @param {Object} memo empty object to permit memoization in parallel 
 * @param {Object} memo2 empty object to permit more memoization in parallel
 * @param {Object} imgPath key must be an array of colors and value is the path to the corresponding image.
 * @param {*} tree Octree 
 * @return {Promise<HTMLImageElement>} 
 */
export const drawImage = (pixelColor, memo, memo2, imgPath, tree) =>{
    let memorized = memo[pixelColor];
    if(!memorized){
        memorized = tree.find(...pixelColor, 25);
        if(!memorized) memorized = tree.find(...pixelColor);
        memo[pixelColor] = memorized;
    }
    let imagen = memo2[memorized];
    if(!imagen){
        imagen = loadImage(imgPath[memorized]).catch(() => null);
        memo2[memorized] = imagen;
    }
    return imagen;
}