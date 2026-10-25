// One-time download of the public listing-image URLs selected for this event.
// Re-run explicitly after updating the manifest; no listing scraping runs in the app.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
const manifest = JSON.parse(await readFile("lib/listing-photos.json", "utf8"));
const assets = JSON.parse(
  await readFile("lib/listing-assets.json", "utf8").catch(() => "{}"),
);
const selected = process.argv.slice(2);
for (const [id, urls] of Object.entries(manifest)) {
  if (selected.length && !selected.includes(id)) continue;
  const seen = new Set();
  const photos = urls.filter((url) => {
    const key = url.includes("zillowstatic")
      ? url.split("/").pop().split("-cc_")[0]
      : url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  assets[id] = [];
  await mkdir(path.join("public", "listings", id), { recursive: true });
  await Promise.all(
    photos.map(async (url, index) => {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok)
        throw new Error(`${id} photo ${index + 1}: HTTP ${res.status}`);
      const type = res.headers.get("content-type") ?? "";
      if (!type.startsWith("image/")) throw new Error(`${id}: not an image`);
      const ext = type.includes("webp")
        ? "webp"
        : type.includes("png")
          ? "png"
          : "jpg";
      const filename = `${index + 1}.${ext}`;
      const bytes = Buffer.from(await res.arrayBuffer());
      await writeFile(path.join("public", "listings", id, filename), bytes);
      assets[id][index] = `/listings/${id}/${filename}`;
    }),
  );
  console.log(`${id}: ${assets[id].length} listing photos downloaded`);
}
await writeFile(
  "lib/listing-assets.json",
  JSON.stringify(assets, null, 2) + "\n",
);
