import { getAuth } from "./auth";

const API_BASE = "http://localhost:8000";

/**
 * Upload an image file to Cloudinary via the backend and return the CDN URL.
 * @param {File} file - The image File object from an <input type="file">
 * @param {string} folder - Cloudinary sub-folder (e.g. 'avatars', 'articles/title', 'articles/inline')
 * @returns {Promise<string>} The secure Cloudinary CDN URL
 */
export async function uploadImage(file, folder = "general") {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE}/api/upload/image?folder=${encodeURIComponent(folder)}`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Image upload failed.");
  }

  const data = await response.json();
  return data.url;
}
