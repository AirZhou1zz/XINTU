import type { RgbaImage } from "@/lib/color/types";

export type LoadedImage = {
  pixels: RgbaImage;
  previewUrl: string;
  name: string;
};

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法读取这张图片。"));
    image.src = url;
  });
}

function fitSize(width: number, height: number, maxDimension: number) {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function loadImageFile(file: File, options?: { maxDimension?: number }): Promise<LoadedImage> {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const size = fitSize(image.naturalWidth, image.naturalHeight, options?.maxDimension ?? 1600);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("当前浏览器不支持 Canvas 2D。");
    context.drawImage(image, 0, 0, size.width, size.height);
    const data = context.getImageData(0, 0, size.width, size.height);
    return {
      pixels: { width: size.width, height: size.height, data: data.data },
      previewUrl: canvas.toDataURL("image/jpeg", 0.9),
      name: file.name,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function rgbaToDataUrl(image: RgbaImage, type = "image/png", quality = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器不支持 Canvas 2D。");
  context.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
  return canvas.toDataURL(type, quality);
}

export function rgbaToJpegDataUrl(image: RgbaImage, maxDimension = 1200) {
  const size = fitSize(image.width, image.height, maxDimension);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器不支持 Canvas 2D。");
  const source = document.createElement("canvas");
  source.width = image.width;
  source.height = image.height;
  const sourceContext = source.getContext("2d");
  if (!sourceContext) throw new Error("当前浏览器不支持 Canvas 2D。");
  sourceContext.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
  context.drawImage(source, 0, 0, size.width, size.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function downloadRgbaImage(image: RgbaImage, filename = "xintu-color-grade.png") {
  const link = document.createElement("a");
  link.href = rgbaToDataUrl(image);
  link.download = filename;
  link.click();
}
