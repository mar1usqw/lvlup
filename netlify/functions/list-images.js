exports.handler = async (event) => {
  try {
    const folder = (event.queryStringParameters?.folder || "").replace(/^\/+/, "");
    if (!folder) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing folder parameter" }),
      };
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Cloudinary environment variables not set" }),
      };
    }

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const prefix = folder.endsWith("/") ? folder : folder + "/";

    let nextCursor = null;
    let resources = [];

    do {
      const url = new URL(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`);
      url.searchParams.set("prefix", prefix);
      url.searchParams.set("max_results", "500");
      if (nextCursor) url.searchParams.set("next_cursor", nextCursor);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Basic ${auth}` },
      });

      if (!res.ok) {
        const text = await res.text();
        return {
          statusCode: res.status,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Cloudinary API error", details: text }),
        };
      }

      const data = await res.json();
      resources.push(...(data.resources || []));
      nextCursor = data.next_cursor || null;
    } while (nextCursor);

    // Sort by public_id (works well for bath1, bath2, etc.)
    resources.sort((a, b) => (a.public_id || "").localeCompare(b.public_id || ""));

    const urls = resources.map((r) => r.secure_url).filter(Boolean);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ folder, urls }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: String(error) }),
    };
  }
};
