import fs from "fs-extra";
import path from "path";

const DATA_DIR = path.resolve(__dirname, "../data");

async function convertDirectoryImages(dirName: string, outputFileName: string) {
  const sourceDir = path.join(DATA_DIR, dirName);
  const outputFile = path.join(DATA_DIR, outputFileName);

  console.log(`Converting images in ${dirName} to ${outputFileName}...`);

  if (!(await fs.pathExists(sourceDir))) {
    console.log(`Directory ${dirName} does not exist, skipping.`);
    return;
  }

  const files = await fs.readdir(sourceDir);
  const images: Record<string, string> = {};
  let count = 0;

  for (const file of files) {
    // Only process image files, ignore JSONs and directories
    if (!file.match(/\.(jpg|jpeg|png)$/i)) continue;

    const filePath = path.join(sourceDir, file);
    try {
      const buffer = await fs.readFile(filePath);
      const ext = path.extname(file).toLowerCase().substring(1); // remove dot
      const mimeType = ext === "jpg" ? "jpeg" : ext;
      const base64 = `data:image/${mimeType};base64,${buffer.toString("base64")}`;

      // Use filename without extension as key (e.g., "105.jpg" -> "105")
      const key = path.parse(file).name;
      images[key] = base64;
      count++;
    } catch (err) {
      console.error(`Failed to read/convert ${file}:`, err);
    }
  }

  await fs.outputJson(outputFile, images); // No spaces to keep file size smaller? User asked for JSON storage.
  // Let's use no spaces for base64 huge files to save a bit of space, or maybe not needed.
  // Standard JSON is fine.
  console.log(`Saved ${count} images to ${outputFileName}`);
}

async function main() {
  await convertDirectoryImages("hero", "hero_images.json");
  await convertDirectoryImages("item", "item_images.json");
  await convertDirectoryImages("summoner", "summoner_images.json");
  console.log("Image conversion complete.");
}

main();
