const Network = {
  async api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  },

  element(tag, text, className) {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (className) node.className = className;
    return node;
  },

  photo(url) {
    const image = this.element("img", null, "feed-photo");
    image.alt = "";
    try {
      const parsed = new URL(url, window.location.origin);
      image.src = ["http:", "https:"].includes(parsed.protocol) && url
        ? parsed.href : "/network/public/img/network-logo.jpg";
    } catch {
      image.src = "/network/public/img/network-logo.jpg";
    }
    image.onerror = () => {
      image.onerror = null;
      image.src = "/network/public/img/network-logo.jpg";
    };
    return image;
  },

  async renderList(id, path, render, emptyText) {
    const container = document.getElementById(id);
    if (!container) return;
    container.replaceChildren(this.element("p", "Loading..."));
    try {
      const items = await this.api(path);
      if (!Array.isArray(items)) throw new Error("Unexpected response from server.");
      container.replaceChildren();
      if (!items.length) container.append(this.element("p", emptyText));
      for (const item of items) container.append(render.call(this, item));
    } catch (error) {
      console.error("Could not load Network data:", error);
      container.replaceChildren(this.element("p", "Unable to load this section. Please try again later."));
    }
  },

  feedCard(item, subtitle) {
    const link = this.element("a", null, "feed-card");
    link.href = `vendor.html?id=${encodeURIComponent(item.vendorId || item.id)}`;
    link.append(this.photo(item.photoUrl), this.element("div", item.name, "feed-title"),
      this.element("div", subtitle, "feed-sub"));
    return link;
  },

  loadHomeFeeds() {
    this.renderList("vendors-feed", "/api/network/vendors",
      function (v) { return this.feedCard(v, v.tags || ""); }, "No vendors yet.");
    this.renderList("services-feed", "/api/network/services",
      function (s) { return this.feedCard(s, `$${s.price}`); }, "No services yet.");
    this.renderList("products-feed", "/api/network/products",
      function (p) { return this.feedCard(p, `$${p.price}`); }, "No products yet.");
  },

  loadExplore() {
    return this.renderList("explore-grid", "/api/network/explore", function (item) {
      const card = this.element("div", null, "card");
      card.append(this.element("h2", item.title), this.element("p", item.description));
      return card;
    }, "No posts yet.");
  },

  loadVendors() {
    return this.renderList("vendors-grid", "/api/network/vendors", function (vendor) {
      const card = this.element("a", null, "card");
      card.href = `vendor.html?id=${encodeURIComponent(vendor.id)}`;
      card.append(this.element("h2", vendor.name), this.element("p", vendor.categories || ""),
        this.element("p", vendor.bio || ""));
      return card;
    }, "No vendors yet.");
  },

  async loadVendor() {
    const container = document.getElementById("vendor-container");
    if (!container) return;
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      container.replaceChildren(this.element("p", "No vendor selected."));
      return;
    }
    container.replaceChildren(this.element("p", "Loading..."));
    try {
      const { vendor, products, workshops, services } = await this.api(
        `/api/network/vendor?id=${encodeURIComponent(id)}`
      );
      container.replaceChildren(this.photo(vendor.photoUrl),
        this.element("h2", vendor.name), this.element("p", vendor.bio || ""));
      for (const [title, items, describe] of [
        ["Products", products, p => `$${p.price}`],
        ["Workshops", workshops, w => w.schedule || ""],
        ["Services", services, s => `$${s.price}`]
      ]) {
        container.append(this.element("h2", title, "section-title"));
        if (!items.length) container.append(this.element("p", `No ${title.toLowerCase()} yet.`));
        for (const item of items) {
          const card = this.element("div", null, "item-card");
          card.append(this.element("h3", item.name || item.title),
            this.element("p", describe(item)), this.element("p", item.description || ""));
          container.append(card);
        }
      }
    } catch (error) {
      console.error("Could not load vendor:", error);
      container.replaceChildren(this.element("p", error.message));
    }
  },

  loadWorkshops() {
    return this.renderList("workshops-grid", "/api/network/workshops", function (workshop) {
      const card = this.element("div", null, "card");
      card.append(this.element("h2", workshop.title),
        this.element("p", `Host: ${workshop.hostName}`), this.element("p", workshop.schedule));
      return card;
    }, "No workshops yet.");
  },

  unavailable() {
    alert("This feature is not available yet.");
  },
  login() { this.unavailable(); },
  signup() { this.unavailable(); },
  loadProfile() { this.unavailable(); },
  saveProfile() { this.unavailable(); }
};

window.addEventListener("DOMContentLoaded", () => {
  Network.loadHomeFeeds();
  for (const node of document.querySelectorAll(".node[data-target]")) {
    node.addEventListener("click", () => {
      const panel = document.getElementById(node.dataset.target);
      if (!panel) return;
      document.querySelectorAll(".network-panels .panel").forEach(other => {
        other.style.display = other === panel && other.style.display !== "block" ? "block" : "none";
      });
      if (panel.style.display === "block") panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }
});
