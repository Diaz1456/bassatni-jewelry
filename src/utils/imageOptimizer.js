const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config');

/**
 * Image optimization pipeline using Sharp.
 * Resizes, compresses, and converts to WebP for modern browsers.
 *
 * Usage:
 *  const { optimizeImage } = require('../utils/imageOptimizer');
 *  await optimizeImage('/path/to/input.jpg', '/path/to/output.jpg');
 */

const SUPPORTED_INPUTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff'];
const OUTPUT_FORMATS = ['webp', 'jpeg', 'png'];
const DEFAULT_QUALITY = config.images.quality || 80;
const DEFAULT_MAX_WIDTH = config.images.maxWidth || 1920;

const optimizeImage = async ({
  input,
  output,
  width,
  quality = DEFAULT_QUALITY,
  format = 'webp',
  stripMetadata = true,
}) => {
  try {
    let pipeline = sharp(input);

    const metadata = await pipeline.metadata();
    const ext = path.extname(input).toLowerCase().slice(1);

    if (!SUPPORTED_INPUTS.includes(ext)) {
      throw new Error(`Unsupported image type: ${ext}`);
    }

    const targetWidth = width || metadata.width || DEFAULT_MAX_WIDTH;

    if (targetWidth && targetWidth < metadata.width) {
      pipeline = pipeline.resize({
        width: targetWidth,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    pipeline = pipeline.rotate();

    if (stripMetadata) {
      pipeline = pipeline.withMetadata({ orientation: undefined });
    }

    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality, effort: 6 });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9, quality });
        break;
      default:
        pipeline = pipeline.webp({ quality, effort: 6 });
    }

    await pipeline.toFile(output);

    return {
      input,
      output,
      width: targetWidth,
      format,
      quality,
      originalSize: metadata.size || null,
    };
  } catch (error) {
    console.error(`Error optimizing image ${input}:`, error.message);
    throw error;
  }
};

const optimizeDirectory = async (inputDir, outputDir, options = {}) => {
  try {
    const files = await fs.readdir(inputDir);
    const results = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase().slice(1);
      if (SUPPORTED_INPUTS.includes(ext)) {
        const inputPath = path.join(inputDir, file);
        const basename = path.parse(file).name;
        const formats = options.formats || OUTPUT_FORMATS;

        for (const format of formats) {
          const outputPath = path.join(outputDir, `${basename}.${format}`);
          await fs.mkdir(path.dirname(outputPath), { recursive: true });
          const result = await optimizeImage({
            input: inputPath,
            output: outputPath,
            format,
            ...options,
          });
          results.push(result);
        }
      }
    }

    return results;
  } catch (error) {
    console.error(`Error optimizing directory ${inputDir}:`, error.message);
    throw error;
  }
};

const getImageDimensions = async (imagePath) => {
  try {
    const metadata = await sharp(imagePath).metadata();
    return { width: metadata.width, height: metadata.height };
  } catch (error) {
    console.error(`Error getting dimensions for ${imagePath}:`, error.message);
    return null;
  }
};

module.exports = {
  optimizeImage,
  optimizeDirectory,
  getImageDimensions,
  SUPPORTED_INPUTS,
  OUTPUT_FORMATS,
};