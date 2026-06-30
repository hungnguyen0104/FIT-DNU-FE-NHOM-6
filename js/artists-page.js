// Trang tổng hợp nghệ sĩ + tác phẩm (dùng chung artworksData/artistsData với modal.js)
let artworksData = [];
let artistsData = [];

function getArtworksByArtist(artistId) {
  return artworksData.filter((a) => a.artistId == artistId);
}

function renderArtists(searchQuery = "") {
  const container = document.getElementById("artists-container");
  if (!container) return;

  const q = (searchQuery || "").trim().toLowerCase();
  let list = artistsData.slice();

  if (q) {
    list = list.filter((artist) => {
      const name = (artist.name || "").toLowerCase();
      const bio = (artist.bio || artist.description || "").toLowerCase();
      return name.includes(q) || bio.includes(q);
    });
  }

  const totalArtworks = artworksData.length;
  document.getElementById("stat-artist-count").textContent = list.length;
  document.getElementById("stat-artwork-count").textContent = totalArtworks;

  if (list.length === 0) {
    container.innerHTML =
      '<p class="text-center text-secondary py-5">Không tìm thấy nghệ sĩ phù hợp.</p>';
    return;
  }

  container.innerHTML = list
    .map((artist) => {
      const works = getArtworksByArtist(artist.id);
      const avatar =
        artist.avatar ||
        "https://ui-avatars.com/api/?name=" +
          encodeURIComponent(artist.name || "Artist") +
          "&background=d4af37&color=0a0a0a";

      const worksHtml =
        works.length === 0
          ? '<p class="text-secondary small mb-0">Chưa có tác phẩm được duyệt.</p>'
          : `<div class="artist-works-grid">
              ${works
                .map(
                  (art) => `
                <article class="artist-work-card" onclick="openArtworkModal('${art.id}')" title="${art.title}">
                  <img src="${art.image}" alt="${art.title}" loading="lazy" />
                  <div class="artist-work-overlay">
                    <div class="artist-work-title text-truncate">${art.title}</div>
                    ${typeof renderStyleTag === "function" ? renderStyleTag(art.style) : ""}
                  </div>
                </article>
              `
                )
                .join("")}
            </div>`;

      const bio = artist.bio || artist.description || "Nghệ sĩ độc quyền tại ArtGallery.";

      return `
        <section class="artist-section glass-panel mb-4" id="artist-${artist.id}">
          <div class="artist-section-head">
            <img class="artist-avatar-lg" src="${avatar}" alt="${artist.name}" />
            <div class="artist-section-meta">
              <h2 class="artist-section-name">${artist.name || "Unknown"}</h2>
              <p class="artist-section-bio text-secondary mb-2">${bio}</p>
              <div class="d-flex flex-wrap gap-3 align-items-center">
                <span class="artist-stat-pill">
                  <i class="fas fa-images me-1"></i>${works.length} tác phẩm
                </span>
                <span class="artist-stat-pill">
                  <i class="fas fa-heart me-1"></i>${works.reduce((s, w) => s + (parseInt(w.likes) || 0), 0)} lượt tim
                </span>
              </div>
            </div>
          </div>
          <div class="artist-section-works mt-4">
            <h3 class="artist-works-heading">Tác phẩm</h3>
            ${worksHtml}
          </div>
        </section>
      `;
    })
    .join("");
}

function initNavbarScroll() {
  const navbar = document.getElementById("main-navbar");
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle("navbar-scrolled", window.scrollY > 50);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

async function initArtistsPage() {
  const [artworks, artists] = await Promise.all([api.getArtworks(), api.getArtists()]);
  artworksData = (artworks || []).filter((a) => a.status === "Đã duyệt");
  artistsData = artists || [];

  renderArtists();
  initNavbarScroll();

  const searchInput = document.getElementById("artistSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => renderArtists(searchInput.value));
  }
}

document.addEventListener("DOMContentLoaded", initArtistsPage);
