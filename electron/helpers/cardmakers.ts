
import sharp from "sharp";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

import type { Region } from 'sharp'
import type { cardMaker, cardMakerPDF } from '../main/express-app-d'


export async function cropImage(inputPath: string, outputPath: string, cropOptions: Region) {
  try {
    const roundedCornersSVG = Buffer.from(
      `<svg width="${cropOptions.width}" height="${cropOptions.height}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${cropOptions.width}" height="${cropOptions.height}" rx="11.338582677" ry="11.338582677" fill="white" />
      </svg>`
    );

    await sharp(inputPath)
      .extract({
        left: cropOptions.left, // X-coordinate of the top-left corner
        top: cropOptions.top, // Y-coordinate of the top-left corner
        width: cropOptions.width, // Width of the cropped area
        height: cropOptions.height, // Height of the cropped area
      })
      .keepMetadata()
      .composite([{ input: roundedCornersSVG, blend: "dest-in" }])
      .toFile(outputPath);

    console.log("Image cropped successfully!", inputPath, outputPath);
  } catch (error) {
    console.error("Error cropping image:", error);
  }
}

export async function extractEshrem(pdf: cardMakerPDF): Promise<cardMakerPDF> {
  if (pdf.isCropped) return pdf;

  // Extract the front and back cards
  const inputPath = `${pdf.path}${pdf.cardBoth}` as string;
  const fileNameWithoutExt = path.basename(
    inputPath,
    path.extname(inputPath)
  );

  const frontOutputPath = `${pdf.path}${fileNameWithoutExt}-front.jpg` // Path to save the cropped image
  const frontCropOptions = {
    left: 1537,
    top: 477,
    width: 1903,
    height: 1215,
  };
  cropImage(inputPath, frontOutputPath, frontCropOptions);

  const backOutputPath = `${pdf.path}${fileNameWithoutExt}-back.jpg`; // Path to save the cropped image
  const backCropOptions = {
    left: 1537,
    top: 1712,
    width: 1903,
    height: 1215,
  };
  await cropImage(inputPath, backOutputPath, backCropOptions);

  pdf.cardFront = `${fileNameWithoutExt}-front.jpg`;
  pdf.cardBack = `${fileNameWithoutExt}-back.jpg`;
  pdf.isCropped = true;

  console.log('pdf extracted successfully')

  return pdf
}

export async function createA4PDFwithEshremCards(obj: cardMaker) {

  if (obj?.pdfs) {

    const path = obj.pdfs[0].path
    const pdfs = obj.pdfs;

    for (let i = 0; i < pdfs.length; i++) {
      pdfs[i] = await extractEshrem(pdfs[i]);
    }

    // Create a new PDF document
    obj.outputFile = `${path}${obj.id}-eshrem.pdf`; // Output PDF file
    createA4WithImagesPDF(obj)

  }

  return obj;

}


async function createA4WithImagesPDF(maker: cardMaker) {
  try {
    // Define dimensions in pixels (Sharp uses pixels, not mm)
    const dpi = 300; // 300 DPI for high quality
    const mmToPx = (mm: number) => Math.round((mm / 25.4) * dpi); // Convert mm to pixels

    const atmWidthPx = mmToPx(85.6); // ATM card width in pixels
    const atmHeightPx = mmToPx(53.98); // ATM card height in pixels


    // Create a new PDF document
    const doc = new PDFDocument({
      size: "A4", // Set page size to A4
      layout: "portrait",
    });

    // Pipe the PDF to a file
    const writeStream = fs.createWriteStream(maker.outputFile as string);
    doc.pipe(writeStream);

    // Draw the images on the PDF
    const atmWidthMM = 85.6; // ATM card width in mm
    const atmHeightMM = 53.98; // ATM card height in mm

    // Convert position and size to points (72 points per inch)
    const mmToPt = (mm: number) => (mm / 25.4) * 72;

    let count = 1
    // let margin = 10
    let top = 3.136

    for (let pdf of maker.pdfs as cardMakerPDF[]) {


      // Resize the images to ATM card size
      const basePath = pdf.path
      const front = await sharp(basePath + pdf.cardFront as string)
        .resize(atmWidthPx, atmHeightPx, { fit: "fill" })
        .toBuffer();

      const back = await sharp(basePath + pdf.cardBack as string)
        .resize(atmWidthPx, atmHeightPx, { fit: "fill" })
        .toBuffer();

      // Place the first image
      doc.image(front, mmToPt(12.86), mmToPt(top), {
        width: 250,
        height: 158,
      });

      // Place the second image
      doc
        .image(back, mmToPt(108.0338), mmToPt(top), {
          width: 250,
          height: 158,
        })
        .stroke();

      top += 58.5748

    }


    // Finalize the PDF
    doc.end();

    // Wait for the write stream to finish
    writeStream.on("finish", () => {
      console.log("PDF created successfully:", maker.outputFile);
    });
  } catch (error) {
    console.error("Error creating PDF:", error);
  }
}

