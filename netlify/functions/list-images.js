const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function listByPrefix(prefix, resource_type) {
  const out = [];
  let next_cursor = undefined;

  do {
    const res = await cloudinary.api.resources({
      type: "upload",
      resource_type,
      prefix,
      max_results: 500,
      next_cursor,
    });

    out.push(...(res.resources || []).map(r => r.secure_url));
    next_cursor = res.next_cursor;
  } while (next_cursor);

  return out;
}

exports.handler = async (event) => {
  try {
    const folder = event.queryStringParameters?.folder;
    if (!folder) return { statusCode: 400, body: "Missing folder" };

    const prefix = folder.endsWith("/") ? folder : folder + "/";

    // Try image first, then auto fallback
    let urls = await listByPrefix(prefix, "image");
    if (urls.length === 0) {
      urls = await listByPrefix(prefix, "auto");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ folder, prefix, urls }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
