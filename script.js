const API_URL = "https://script.google.com/macros/s/AKfycbxz7XLbPCSoNRd7j3AAUbSFysFsBh0L5ulqxdc6svRmPIFxeFKriItS9xG86nnUYZA/exec";

let products = [];
let categories = [];
let activeFilter = "Усі";
let cart = JSON.parse(localStorage.getItem("veloraCart") || "{}");

const productGrid = document.getElementById("productGrid");
const categoryGrid = document.getElementById("categoryGrid");
const searchInput = document.getElementById("searchInput");
const filters = document.getElementById("filters");
const emptyState = document.getElementById("emptyState");

const cartButton = document.getElementById("cartButton");
const mobileCartButton = document.getElementById("mobileCartButton");
const cartDrawer = document.getElementById("cartDrawer");
const closeCart = document.getElementById("closeCart");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cartItems");
const cartEmpty = document.getElementById("cartEmpty");
const cartCount = document.getElementById("cartCount");
const mobileCartCount = document.getElementById("mobileCartCount");
const cartTotal = document.getElementById("cartTotal");

const checkoutButton = document.getElementById("checkoutButton");
const checkoutModal = document.getElementById("checkoutModal");
const closeCheckout = document.getElementById("closeCheckout");
const checkoutForm = document.getElementById("checkoutForm");
const toast = document.getElementById("toast");

function formatPrice(value) {
  return new Intl.NumberFormat("uk-UA").format(Number(value) || 0) + " грн";
}

function isYes(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return ["так", "true", "1", "yes", "y"].includes(v);
}

function safeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeImageUrl(url) {
  if (!url) return "";
  const value = String(url).trim();

  const driveMatch =
    value.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    value.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (driveMatch) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1200`;
  }

  return value;
}

function normalizeProduct(p) {
  return {
    id: String(p.id ?? ""),
    name: String(p.name ?? ""),
    category: String(p.category ?? ""),
    price: Number(p.price) || 0,
    salePrice: Number(p.salePrice) || 0,
    oldPrice: Number(p.oldPrice) || 0,
    sale: p.sale,
    description: String(p.description ?? ""),
    image: normalizeImageUrl(p.image)
  };
}

function getProductPrice(p) {
  return isYes(p.sale) && p.salePrice > 0 ? p.salePrice : p.price;
}

function getOldPrice(p) {
  const current = getProductPrice(p);
  if (p.oldPrice > current) return p.oldPrice;
  if (isYes(p.sale) && p.salePrice > 0 && p.price > p.salePrice) return p.price;
  return 0;
}

function categoryFallbackIcon(name) {
  const icons = {
    "Обличчя":"🫧",
    "Макіяж":"💄",
    "Волосся":"🪮",
    "Тіло":"🌿",
    "Парфуми":"🌸",
    "Набори":"🎁"
  };
  return icons[name] || "✨";
}

async function loadStore() {
  emptyState.hidden = false;
  emptyState.textContent = "Завантажуємо каталог…";

  try {
    const response = await fetch(`${API_URL}?action=store`, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) throw new Error("Не вдалося завантажити дані");

    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Помилка API");

    products = (data.products || []).map(normalizeProduct);
    categories = data.categories || [];

    renderCategories();
    renderProducts();
    renderCart();
  } catch (error) {
    console.error(error);
    emptyState.hidden = false;
    emptyState.textContent = "Не вдалося завантажити каталог. Перевірте підключення до Google Таблиці.";
    showToast("Помилка завантаження каталогу");
  }
}

function renderCategories() {
  const activeCategories = categories.filter(c => c && c.name);

  categoryGrid.innerHTML = activeCategories.map(c => `
    <button class="category-card" data-category="${safeText(c.name)}" type="button">
      <span class="category-icon">${safeText(c.icon || categoryFallbackIcon(c.name))}</span>
      <strong>${safeText(c.name)}</strong>
      <small>${safeText(c.description || "")}</small>
    </button>
  `).join("");

  filters.innerHTML = [
    `<button class="filter ${activeFilter === "Усі" ? "active" : ""}" type="button" data-filter="Усі">Усі</button>`,
    ...activeCategories.map(c => `
      <button class="filter ${activeFilter === c.name ? "active" : ""}" type="button" data-filter="${safeText(c.name)}">
        ${safeText(c.name)}
      </button>
    `)
  ].join("");
}

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = products.filter(p => {
    const fitsCategory = activeFilter === "Усі" || p.category === activeFilter;
    const fitsQuery = !query ||
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query);

    return fitsCategory && fitsQuery;
  });

  productGrid.innerHTML = filtered.map(p => {
    const currentPrice = getProductPrice(p);
    const oldPrice = getOldPrice(p);
    const onSale = isYes(p.sale) && p.salePrice > 0;

    const imageHtml = p.image
      ? `<div class="product-image has-photo"><img src="${safeText(p.image)}" alt="${safeText(p.name)}" loading="lazy" onerror="this.parentElement.classList.remove('has-photo');this.parentElement.innerHTML='${categoryFallbackIcon(p.category)}';"></div>`
      : `<div class="product-image">${categoryFallbackIcon(p.category)}</div>`;

    return `
      <article class="product-card">
        ${onSale ? '<span class="sale-badge">Акція</span>' : ''}
        ${imageHtml}
        <div class="product-body">
          <span class="product-category">${safeText(p.category)}</span>
          <strong class="product-name">${safeText(p.name)}</strong>
          <p class="product-desc">${safeText(p.description)}</p>
          <div class="product-bottom">
            <div class="price-wrap">
              <span class="price">${formatPrice(currentPrice)}</span>
              ${oldPrice ? `<span class="old-price">${formatPrice(oldPrice)}</span>` : ""}
            </div>
            <button class="add-btn" data-add="${safeText(p.id)}" type="button" aria-label="Додати ${safeText(p.name)}">+</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  if (filtered.length) {
    emptyState.hidden = true;
  } else {
    emptyState.hidden = false;
    emptyState.textContent = products.length
      ? "Нічого не знайдено. Спробуйте інший запит."
      : "У каталозі поки немає активних товарів.";
  }
}

function saveCart() {
  localStorage.setItem("veloraCart", JSON.stringify(cart));
}

function findProduct(id) {
  return products.find(item => String(item.id) === String(id));
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  showToast("Додано в кошик");
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id] += delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  delete cart[id];
  saveCart();
  renderCart();
}

function cartSummary() {
  let count = 0;
  let total = 0;

  for (const [id, qty] of Object.entries(cart)) {
    const p = findProduct(id);
    if (!p) continue;
    count += Number(qty);
    total += getProductPrice(p) * Number(qty);
  }

  return { count, total };
}

function renderCart() {
  const entries = Object.entries(cart).filter(([id, qty]) =>
    Number(qty) > 0 && findProduct(id)
  );

  cartItems.innerHTML = entries.map(([id, qty]) => {
    const p = findProduct(id);
    return `
      <div class="cart-row">
        <div class="cart-thumb">${categoryFallbackIcon(p.category)}</div>
        <div>
          <strong>${safeText(p.name)}</strong>
          <small>${formatPrice(getProductPrice(p))}</small>
          <div class="qty">
            <button type="button" data-minus="${safeText(p.id)}">−</button>
            <span>${Number(qty)}</span>
            <button type="button" data-plus="${safeText(p.id)}">+</button>
          </div>
        </div>
        <button class="remove-btn" type="button" data-remove="${safeText(p.id)}">Видалити</button>
      </div>
    `;
  }).join("");

  const { count, total } = cartSummary();
  cartCount.textContent = count;
  mobileCartCount.textContent = count;
  cartTotal.textContent = formatPrice(total);
  cartEmpty.style.display = entries.length ? "none" : "flex";
  cartItems.style.display = entries.length ? "block" : "none";
  checkoutButton.disabled = entries.length === 0;
  checkoutButton.style.opacity = entries.length ? "1" : ".5";
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeCartDrawer() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
  document.body.style.overflow = "";
}

function openCheckout() {
  const { count } = cartSummary();
  if (!count) return;
  closeCartDrawer();
  checkoutModal.classList.add("open");
  checkoutModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCheckoutModal() {
  checkoutModal.classList.remove("open");
  checkoutModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1900);
}

productGrid.addEventListener("click", e => {
  const btn = e.target.closest("[data-add]");
  if (btn) addToCart(btn.dataset.add);
});

filters.addEventListener("click", e => {
  const btn = e.target.closest("[data-filter]");
  if (!btn) return;

  activeFilter = btn.dataset.filter;
  document.querySelectorAll(".filter").forEach(el => el.classList.remove("active"));
  btn.classList.add("active");
  renderProducts();
});

categoryGrid.addEventListener("click", e => {
  const btn = e.target.closest("[data-category]");
  if (!btn) return;

  activeFilter = btn.dataset.category;
  document.querySelectorAll(".filter").forEach(el => {
    el.classList.toggle("active", el.dataset.filter === activeFilter);
  });
  renderProducts();
  document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
});

searchInput.addEventListener("input", renderProducts);

cartItems.addEventListener("click", e => {
  const minus = e.target.closest("[data-minus]");
  const plus = e.target.closest("[data-plus]");
  const remove = e.target.closest("[data-remove]");

  if (minus) changeQty(minus.dataset.minus, -1);
  if (plus) changeQty(plus.dataset.plus, 1);
  if (remove) removeFromCart(remove.dataset.remove);
});

cartButton.addEventListener("click", openCart);
mobileCartButton.addEventListener("click", openCart);
closeCart.addEventListener("click", closeCartDrawer);
overlay.addEventListener("click", closeCartDrawer);
checkoutButton.addEventListener("click", openCheckout);
closeCheckout.addEventListener("click", closeCheckoutModal);

checkoutModal.addEventListener("click", e => {
  if (e.target === checkoutModal) closeCheckoutModal();
});

checkoutForm.addEventListener("submit", async e => {
  e.preventDefault();

  const submitButton = checkoutForm.querySelector('button[type="submit"]');
  const data = new FormData(checkoutForm);
  const { total } = cartSummary();

  const orderProducts = Object.entries(cart)
    .map(([id, quantity]) => {
      const p = findProduct(id);
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        quantity: Number(quantity),
        price: getProductPrice(p)
      };
    })
    .filter(Boolean);

  const payload = {
    action: "order",
    name: data.get("name"),
    phone: data.get("phone"),
    city: data.get("city"),
    delivery: data.get("delivery"),
    comment: data.get("comment"),
    products: orderProducts,
    total
  };

  submitButton.disabled = true;
  submitButton.textContent = "Відправляємо…";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Помилка відправлення");

    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Помилка API");

    cart = {};
    saveCart();
    renderCart();
    checkoutForm.reset();
    closeCheckoutModal();
    showToast(result.orderNumber
      ? `Замовлення ${result.orderNumber} оформлено ✓`
      : "Замовлення оформлено ✓"
    );
  } catch (error) {
    console.error(error);
    showToast("Не вдалося відправити замовлення");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Підтвердити замовлення";
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeCartDrawer();
    closeCheckoutModal();
  }
});

loadStore();
