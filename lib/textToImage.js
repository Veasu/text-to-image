const fs = require('fs');
const path = require('path');
const Canvas = require('canvas');
const { Image } = require('canvas');
const StackBlur = require('stackblur-canvas');

const defaults = {
  debug: false,
  maxWidth: 400,
  fontSize: 18,
  lineHeight: 28,
  margin: 10,
  bgColor: '#fff',
  textColor: '#000',
  fontFamily: 'Helvetica',
  fontWeight: 'normal',
  customHeight: 0,
  textAlign: 'left',
};

const createTextData = (
  text,
  maxWidth,
  fontSize,
  lineHeight,
  bgColor,
  textColor,
  fontFamily,
  fontWeight,
  customHeight,
  textAlign,
) => {
  // create a tall context so we definitely can fit all text
  const textCanvas = Canvas.createCanvas(maxWidth, 1000);
  const textContext = textCanvas.getContext('2d');
  textContext.clearRect(0, 0, maxWidth, 1000);
  // set the text alignment and start position
  let textX = 0;
  let textY = 0;
  if (['center'].includes(textAlign.toLowerCase())) {
    textX = maxWidth / 2;
  }
  if (['right', 'end'].includes(textAlign.toLowerCase())) {
    textX = maxWidth;
  }
  textContext.textAlign = textAlign;

  // make text
  textContext.fillStyle = textColor;
  textContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  textContext.textBaseline = 'top';
  textContext.lineWidth = 1.5;

  // split the text into words
  const words = text.split(' ');
  let wordCount = words.length;

  // the start of the first line
  let line = '';
  const addNewLines = [];
  let lines = 0;
  let actualfontHeight = 0;
  let fontHeight = 0;
  let largestLineWidth = 0;

  for (let n = 0; n < wordCount; n += 1) {
    let word = words[n];

    if (/\n/.test(words[n])) {
      const parts = words[n].split('\n');
      // use the first word before the newline(s)
      word = parts.shift();
      // mark the next word as beginning with newline
      addNewLines.push(n + 1);
      // return the rest of the parts to the words array at the same index
      words.splice(n + 1, 0, parts.join('\n'));
      wordCount += 1;
    }

    // append one word to the line and see
    // if its width exceeds the maxWidth
    const testLine = `${line}${word} `;
    const testLineWidth = textContext.measureText(testLine).width;
    actualfontHeight = textContext.measureText(line).actualBoundingBoxDescent;
    fontHeight =
      textContext.measureText(testLine).actualBoundingBoxAscent +
      textContext.measureText(testLine).actualBoundingBoxDescent;

    // if the line is marked as starting with a newline
    // OR if the line is too long, add a newline
    if (addNewLines.indexOf(n) > -1 || (testLineWidth > maxWidth && n > 0)) {
      // if the line exceeded the width with one additional word
      // just paint the line without the word
      textContext.fillText(line, textX, textY);
      textContext.strokeText(line, textX, textY);

      if (textContext.measureText(line).width > largestLineWidth) {
        largestLineWidth = textContext.measureText(line).width;
      }

      if (
        textContext.measureText(line).actualBoundingBoxDescent >
        actualfontHeight
      ) {
        largestLineHeight = textContext.measureText(line).width;
      }
      // start a new line with the last word
      // and add the following (if this word was a newline word)
      line = `${word} `;

      // move the pen down
      textY += fontHeight + lineHeight;
      lines++;
    } else {
      // if not exceeded, just continue
      line = testLine;
    }
  }
  // paint the last line
  textContext.fillText(line, textX, textY);
  textContext.strokeText(line, textX, textY);
  lines++;

  if (textContext.measureText(line).width > largestLineWidth) {
    largestLineWidth = textContext.measureText(line).width;
  }

  const textHeight = textY + fontHeight + lineHeight;

  //let actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  //return textCanvas.toDataURL()

  const textCanvas2 = Canvas.createCanvas(largestLineWidth, textHeight + 30);
  //let imgData = textContext.getImageData((maxWidth-largestLineWidth)/2, actualfontHeight-fontHeight, largestLineWidth, (actualfontHeight*lines));
  // console.log(imgData.width + " " + largestLineWidth);
  // console.log(imgData.height + " " + (actualfontHeight*lines));
  let imgData = textContext.getImageData(0, 0, maxWidth, textHeight + 30);
  textCanvas2.getContext('2d').putImageData(imgData, 0, 0);
  return textCanvas2.toBuffer();

  //return textCanvas2.getContext('2d').getImageData(0, 0, largestLineWidth, textHeight);
};

const createCanvas = async (content, conf, images) => {
  const textData = createTextData(
    content,
    conf.maxWidth,
    conf.fontSize,
    conf.lineHeight,
    conf.bgColor,
    conf.textColor,
    conf.fontFamily,
    conf.fontWeight,
    conf.customHeight,
    conf.textAlign,
  );

  const canvas = Canvas.createCanvas(conf.maxWidth, conf.customHeight);
  const ctx = canvas.getContext('2d');

  ctx.globalAlpha = 1;
  ctx.fillStyle = conf.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let coords = [
    { x: 0, y: 0 },
    { x: canvas.width / 2, y: 0 },
    { x: 0, y: canvas.height / 2 },
    { x: canvas.width / 2, y: canvas.height / 2 },
  ];
  let imagesFin = [];
  for (x in images) {
    imagesFin.push(await Canvas.loadImage(images[x]));
  }

  let count = 0;
  imagesFin.forEach(element => {
    ctx.drawImage(
      element,
      coords[count].x,
      coords[count].y,
      canvas.width / 2,
      canvas.height / 2,
    );
    count++;
  });

  StackBlur.canvasRGB(canvas, 0, 0, canvas.width, canvas.height, 5);

  // const textCanvas = Canvas.createCanvas(textData.width,textData.height);
  // textCanvas.getContext('2d').putImageData(textData,0,0);
  //let textImage = await Canvas.loadImage(textCanvas.toBuffer());
  let textImage = await Canvas.loadImage(textData);
  console.log(textImage.width);
  ctx.drawImage(textImage, 40, canvas.height - textImage.height - 40); //(canvas.width - textImage.width) / 2, (canvas.height - textImage.height) / 2);
  return canvas;
};

const registerFont = (fontPath, fontOptions) => {
  Canvas.registerFont(fontPath, fontOptions);
};

const generateImage = async (content, config, images) => {
  const conf = { ...defaults, ...config };
  const canvas = await createCanvas(content, conf, images);
  const dataUrl = canvas.toDataURL();

  if (conf.debug) {
    const fileName =
      conf.debugFilename ||
      `${new Date().toISOString().replace(/[\W.]/g, '')}.png`;

    return new Promise(resolve => {
      const pngStream = canvas.createPNGStream();
      const out = fs.createWriteStream(path.join(process.cwd(), fileName));
      out.on('close', () => {
        resolve(dataUrl);
      });
      pngStream.pipe(out);
    });
  }

  return Promise.resolve(dataUrl);
};

const generateImageSync = (content, config, images) => {
  const conf = { ...defaults, ...config };
  const canvas = createCanvas(content, conf, images);
  canvas;
  const dataUrl = canvas.toDataURL();
  if (conf.debug) {
    const fileName =
      conf.debugFilename ||
      `${new Date().toISOString().replace(/[\W.]/g, '')}.png`;
    fs.writeFileSync(fileName, canvas.toBuffer());
    return dataUrl;
  }
  return dataUrl;
};

module.exports = {
  generate: generateImage,
  generateSync: generateImageSync,
  registerFont: registerFont,
};
