// STAFF SYSTEM — LOCAL STORAGE VERSION
// This file controls EVERYTHING the vendor can do AFTER login.
// Auth is handled separately in auth.js (you said we do that last).

const Staff = {

  key: "network_staff_user",

  // -----------------------------
  // GET / SAVE USER
  // -----------------------------
  getUser() {
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) : null;
  },

  saveUser(user) {
    localStorage.setItem(this.key, JSON.stringify(user));
  },

  // -----------------------------
  // DASHBOARD AUTO-ADAPT
  // -----------------------------
  initDashboard() {
    const user = this.getUser();
    if (!user) {
      window.location.href = "/network/staff/pages/login.html";
      return;
    }

    const types = user.types || [];

    // Hide nodes based on vendor type
    if (!types.includes("product")) {
      document.getElementById("node-products")?.classList.add("hidden");
    }

    if (!types.includes("service")) {
      document.getElementById("node-services")?.classList.add("hidden");
    }

    if (!types.includes("workshop")) {
      document.getElementById("node-workshops")?.classList.add("hidden");
    }

    if (!types.includes("product") && !types.includes("service")) {
      document.getElementById("node-orders")?.classList.add("hidden");
    }

    // Payouts always visible
    // Show name in header if you want
    const title = document.querySelector(".network-title");
    if (title) title.textContent = `Staff Dashboard — ${user.name}`;
  },

  // -----------------------------
  // PROFILE PAGE
  // -----------------------------
  loadProfile() {
    const user = this.getUser();
    if (!user) return;

    document.getElementById("vendor-name").value = user.name || "";
    document.getElementById("vendor-bio").value = user.bio || "";
    document.getElementById("vendor-tags").value = (user.tags || []).join(", ");
    document.getElementById("vendor-paypal").value = user.paypal || "";
    document.getElementById("vendor-active").checked = user.active || false;
    document.getElementById("vendor-location").checked = user.shareLocation || false;

    // Vendor types
    const types = user.types || [];
    document.getElementById("type-product").checked = types.includes("product");
    document.getElementById("type-service").checked = types.includes("service");
    document.getElementById("type-workshop").checked = types.includes("workshop");
    document.getElementById("type-creator").checked = types.includes("creator");

    // Photo preview
    if (user.photo) {
      const img = document.getElementById("vendor-photo-preview");
      if (img) img.src = user.photo;
    }
  },

  saveProfile() {
    const user = this.getUser();
    if (!user) return;

    const types = [];
    if (document.getElementById("type-product").checked) types.push("product");
    if (document.getElementById("type-service").checked) types.push("service");
    if (document.getElementById("type-workshop").checked) types.push("workshop");
    if (document.getElementById("type-creator").checked) types.push("creator");

    const tags = document.getElementById("vendor-tags").value
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    user.name = document.getElementById("vendor-name").value;
    user.bio = document.getElementById("vendor-bio").value;
    user.tags = tags;
    user.types = types;
    user.paypal = document.getElementById("vendor-paypal").value;
    user.active = document.getElementById("vendor-active").checked;
    user.shareLocation = document.getElementById("vendor-location").checked;

    // Save photo if uploaded
    const fileInput = document.getElementById("vendor-photo");
    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        user.photo = reader.result;
        this.saveUser(user);
        alert("Profile updated");
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      this.saveUser(user);
      alert("Profile updated");
    }
  },

  // -----------------------------
  // PRODUCT SYSTEM
  // -----------------------------
  loadProducts() {
    const user = this.getUser();
    if (!user) return;

    user.products = user.products || [];
    const list = document.getElementById("product-list");

    list.innerHTML = user.products.map((p, i) => `
      <div class="product">
        <h3>${p.name} — $${p.price}</h3>
        <p>${p.description}</p>
        <button onclick="Staff.deleteProduct(${i})">Delete</button>
      </div>
    `).join("");
  },

  addProduct() {
    const user = this.getUser();
    if (!user) return;

    user.products = user.products || [];

    const name = document.getElementById("product-name").value;
    const price = document.getElementById("product-price").value;
    const description = document.getElementById("product-description").value;

    user.products.push({ name, price, description });

    this.saveUser(user);
    location.reload();
  },

  deleteProduct(i) {
    const user = this.getUser();
    if (!user) return;

    user.products.splice(i, 1);
    this.saveUser(user);
    location.reload();
  },

  // -----------------------------
  // SERVICE SYSTEM
  // -----------------------------
  loadServices() {
    const user = this.getUser();
    if (!user) return;

    user.services = user.services || [];
    const list = document.getElementById("service-list");

    list.innerHTML = user.services.map((s, i) => `
      <div class="service">
        <h3>${s.name} — $${s.price}</h3>
        <p>Duration: ${s.duration}</p>
        <p>${s.description}</p>
        <button onclick="Staff.deleteService(${i})">Delete</button>
      </div>
    `).join("");
  },

  addService() {
    const user = this.getUser();
    if (!user) return;

    user.services = user.services || [];

    const name = document.getElementById("service-name").value;
    const price = document.getElementById("service-price").value;
    const duration = document.getElementById("service-duration").value;
    const description = document.getElementById("service-description").value;

    user.services.push({ name, price, duration, description });

    this.saveUser(user);
    location.reload();
  },

  deleteService(i) {
    const user = this.getUser();
    if (!user) return;

    user.services.splice(i, 1);
    this.saveUser(user);
    location.reload();
  },

  // -----------------------------
  // WORKSHOP SYSTEM
  // -----------------------------
  loadWorkshops() {
    const user = this.getUser();
    if (!user) return;

    user.workshops = user.workshops || [];
    const list = document.getElementById("workshop-list");

    list.innerHTML = user.workshops.map((w, i) => `
      <div class="workshop">
        <h3>${w.title} — $${w.price}</h3>
        <p>${w.schedule}</p>
        <p>${w.description}</p>
        <button onclick="Staff.deleteWorkshop(${i})">Delete</button>
      </div>
    `).join("");
  },

  addWorkshop() {
    const user = this.getUser();
    if (!user) return;

    user.workshops = user.workshops || [];

    const title = document.getElementById("workshop-title").value;
    const schedule = document.getElementById("workshop-schedule").value;
    const price = document.getElementById("workshop-price").value;
    const description = document.getElementById("workshop-description").value;

    user.workshops.push({ title, schedule, price, description });

    this.saveUser(user);
    location.reload();
  },

  deleteWorkshop(i) {
    const user = this.getUser();
    if (!user) return;

    user.workshops.splice(i, 1);
    this.saveUser(user);
    location.reload();
  },

  // -----------------------------
  // PREVIEW PUBLIC PAGE
  // -----------------------------
  previewPage() {
    window.location.href = `/network/public/pages/vendor.html?id=me`;
  },

  // -----------------------------
  // NAVIGATION
  // -----------------------------
  go(page) {
    window.location.href = `/network/staff/pages/${page}`;
  }
};
