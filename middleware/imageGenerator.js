const Jimp = require('jimp');

class ImageGenearator {
    async new(signal, data) {
        const image = await Jimp.read(signal === "Long" ? "./middleware/long.png" : "./middleware/short.png");

        const fontWhite = await Jimp.loadFont("./middleware/fonts/Roboto-White.fnt");
        const fontOrange = await Jimp.loadFont("./middleware/fonts/Roboto-Orange.fnt");
        const fontGreenSmall = await Jimp.loadFont("./middleware/fonts/Roboto-Green.fnt");
        const fontGreenBig = await Jimp.loadFont("./middleware/fonts/Roboto-Green-Big.fnt");
        const fontRedSmall = await Jimp.loadFont("./middleware/fonts/RobotoRed.fnt");
        const fontRedBig = await Jimp.loadFont("./middleware/fonts/Roboto-Red-Big.fnt");

        if (data.pnl >= 0) {
            image.print(fontGreenBig, 57, 340, data.pnl + '%');
        } else {
            image.print(fontRedBig, 57, 340, data.pnl + '%');
        }

        image.print(fontWhite, 57, 230, data.symbol);

        //Open price
        image.print(fontOrange, 330, 540, data.open);

        //Close price
        image.print(fontOrange, 330, 602, data.close);

        //Leverage
        image.print(fontOrange, 330, 660, data.leverage + 'X');
        await image.writeAsync(`output.png`);
    }
}

module.exports = new ImageGenearator();