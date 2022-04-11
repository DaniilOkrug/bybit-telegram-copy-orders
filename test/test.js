const Jimp = require('jimp');

async function textOverlay() {
    const fontWhite = await Jimp.loadFont("Roboto-White.fnt");
    const fontOrange = await Jimp.loadFont("Roboto-Orange.fnt");
    const fontGreenSmall = await Jimp.loadFont("Roboto-Green.fnt");
    const fontGreenBig = await Jimp.loadFont("Roboto-Green-Big.fnt");
    const image = await Jimp.read("image.png");

    image.print(fontGreenSmall, 57, 195, 'Long');
    image.print(fontWhite, 57, 230, 'BTCUSDT');
    image.print(fontGreenBig, 57, 340, '19.66%');
    image.print(fontOrange, 330, 540, '37,373.50');
    image.print(fontOrange, 330, 602, '38,479.50');
    image.print(fontOrange, 330, 660, '10x');
    await image.writeAsync(`output.png`);
}

textOverlay();
console.log("Image is processed succesfully");