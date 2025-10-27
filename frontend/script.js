const API_BASE = "https://instagram-api-qc4o.onrender.com"; // change this to your actual API base

const urlInput = document.getElementById("urlInput");
const fetchBtn = document.getElementById("fetchBtn");
const downloadBtn = document.getElementById("downloadBtn");
const resultDiv = document.getElementById("result");
const mediaPreview = document.getElementById("mediaPreview");
const captionEl = document.getElementById("caption");

fetchBtn.addEventListener("click", async () => {
  const url = urlInput.value.trim();
  if (!url) return alert("Please paste a valid Instagram post URL.");

  resultDiv.classList.add("hidden");
  fetchBtn.textContent = "Fetching...";
  fetchBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/info?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    if (!data.image && !data.video) {
      alert("No media found for this post.");
      return;
    }

    // Show preview
    mediaPreview.innerHTML = data.video
      ? `<video controls src="${data.video}"></video>`
      : `<img src="${data.image}" alt="preview" />`;

    captionEl.textContent = data.caption || "";
    resultDiv.classList.remove("hidden");

    // Enable download
    downloadBtn.disabled = false;
    downloadBtn.onclick = () => {
      const type = data.video ? "video" : "image";
      window.open(
        `${API_BASE}/download?url=${encodeURIComponent(url)}&type=${type}`,
        "_blank"
      );
    };
  } catch (err) {
    console.error(err);
    alert("Error fetching post info.");
  } finally {
    fetchBtn.textContent = "Fetch Info";
    fetchBtn.disabled = false;
  }
});
