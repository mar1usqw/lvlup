const cloudinary = require("cloudinary").v2;

exports.handler = async (event) => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // example: projects/outside
    const folder = event.queryStringParameters?.folder || "projects/outside";

    const result = await cloudinary.search
      .expression(`folder:${folder} AND resource_type:image`)
      .sort_by("created_at", "desc")
      .max_results(80)
      .execute();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        images: result.resources.map((r) => r.secure_url),
      }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
