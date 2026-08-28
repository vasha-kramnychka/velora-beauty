const API_URL = "https://script.google.com/macros/s/AKfycbxz7XLbPCSoNRd7j3AAUbSFysFsBh0L5ulqxdc6svRmPIFxeFKriItS9xG86nnUYZA/exec";

let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem("veloraCart") || "{}");
let currentCategory = "";
let currentProductId = null;

const views = {
  home: document.getElementById("view-home"),
  catalog: document.getElementById("view-catalog"),
  category: document.getElementById("view-category"),
  product: document.getElementById("view-product"),
  delivery: document.getElementById("view-delivery")
};

const categoryGrid = document.getElementById("categoryGrid");
const categoryEmpty = document.getElementById("categoryEmpty");
const productGrid = document.getElementById("productGrid");
const productEmpty = document.getElementById("productEmpty");
const searchInput = document.getElementById("searchInput");
const categoryTitle = document.getElementById("categoryTitle");
const categoryDescription = document.getElementById("categoryDescription");
const breadcrumbCategory = document.getElementById("breadcrumbCategory");
const productDetail = document.getElementById("productDetail");
const productCategoryBack = document.getElementById("productCategoryBack");
const productBreadcrumb = document.getElementById("productBreadcrumb");

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

function safeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPrice(value) {
  return new Intl.NumberFormat("uk-UA").format(Number(value) || 0) + " грн";
}

function isYes(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return ["так", "true", "1", "yes", "y"].includes(v);
}

function normalizeImageUrl(url) {
  if (!url) return "";
  const value = String(url).trim();

  const driveMatch =
    value.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    value.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (driveMatch) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1400`;
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

function categoryIcon(name) {
  const map = {
    "Обличчя":"🫧",
    "Макіяж":"💄",
    "Волосся":"🪮",
    "Тіло":"🌿",
    "Парфуми":"🌸",
    "Набори":"🎁"
  };
  return map[name] || "✨";
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

function findProduct(id) {
  return products.find(p => String(p.id) === String(id));
}

function findCategory(name) {
  return categories.find(c => String(c.name) === String(name));
}

function setView(name) {
  Object.values(views).forEach(v => v.classList.remove("active"));
  if (views[name]) views[name].classList.add("active");
  window.scrollTo({top:0, behavior:"smooth"});
}

function routeTo(name) {
  if (name === "home") {
    currentCategory = "";
    currentProductId = null;
    setView("home");
    history.pushState({view:"home"}, "", "#home");
    return;
  }

  if (name === "catalog") {
    currentProductId = null;
    setView("catalog");
    renderCategories();
    history.pushState({view:"catalog"}, "", "#catalog");
    return;
  }

  if (name === "delivery") {
    setView("delivery");
    history.pushState({view:"delivery"}, "", "#delivery");
    return;
  }
}

function openCategory(name, push=true) {
  currentCategory = name;
  currentProductId = null;
  searchInput.value = "";

  const c = findCategory(name);
  categoryTitle.textContent = name;
  breadcrumbCategory.textContent = name;
  categoryDescription.textContent = c?.description || "";
  productCategoryBack.textContent = name;

  renderProducts();
  setView("category");

  if (push) {
    history.pushState({view:"category", category:name}, "", "#category=" + encodeURIComponent(name));
  }
}

function openProduct(id, push=true) {
  const p = findProduct(id);
  if (!p) return;

  currentProductId = String(id);
  currentCategory = p.category;
  productCategoryBack.textContent = p.category;
  productBreadcrumb.textContent = p.name;

  const price = getProductPrice(p);
  const oldPrice = getOldPrice(p);

  const media = p.image
    ? `<div class="product-detail-media"><img src="${safeText(p.image)}" alt="${safeText(p.name)}" onerror="this.parentElement.innerHTML='${categoryIcon(p.category)}'"></div>`
    : `<div class="product-detail-media">${categoryIcon(p.category)}</div>`;

  productDetail.innerHTML = `
    ${media}
    <div class="product-detail-copy">
      <span class="eyebrow">${safeText(p.category)}</span>
      <h1>${safeText(p.name)}</h1>

      <div class="product-detail-price">
        <span class="price">${formatPrice(price)}</span>
        ${oldPrice ? `<span class="old-price">${formatPrice(oldPrice)}</span>` : ""}
      </div>

      <p class="detail-desc">${safeText(p.description || "Опис товару буде додано найближчим часом.")}</p>

      <div class="detail-actions">
        <button class="primary-btn" type="button" data-detail-add="${safeText(p.id)}">Додати в кошик</button>
        <button class="back-btn" type="button" data-back-category="${safeText(p.category)}">← Назад до категорії</button>
      </div>
    </div>
  `;

  setView("product");

  if (push) {
    history.pushState({view:"product", id:String(id)}, "", "#product=" + encodeURIComponent(String(id)));
  }
}

async function loadStore() {
  categoryEmpty.hidden = false;
  categoryEmpty.textContent = "Завантажуємо категорії…";

  try {
    const response = await fetch(`${API_URL}?action=store`, {
      method:"GET",
      cache:"no-store"
    });

    if (!response.ok) throw new Error("Помилка завантаження");

    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Помилка API");

    products = (data.products || []).map(normalizeProduct);
    categories = data.categories || [];

    renderCategories();
    renderCart();
    restoreRouteFromHash();
  } catch (error) {
    console.error(error);
    categoryEmpty.hidden = false;
    categoryEmpty.textContent = "Не вдалося завантажити каталог. Перевірте підключення до Google Таблиці.";
    showToast("Помилка завантаження каталогу");
  }
}

function renderCategories() {
  if (!categories.length) {
    categoryGrid.innerHTML = "";
    categoryEmpty.hidden = false;
    categoryEmpty.textContent = "У каталозі поки немає активних категорій.";
    return;
  }

  categoryGrid.innerHTML = categories.map(c => `
    <button class="category-card" type="button" data-category="${safeText(c.name)}">
      <span class="category-icon">${safeText(c.icon || categoryIcon(c.name))}</span>
      <strong>${safeText(c.name)}</strong>
      <small>${safeText(c.description || "")}</small>
      <span class="category-arrow">Переглянути товари →</span>
    </button>
  `).join("");

  categoryEmpty.hidden = true;
}

function renderProducts() {
  const q = searchInput.value.trim().toLowerCase();

  const filtered = products.filter(p => {
    const sameCategory = p.category === currentCategory;
    const matchesQuery = !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);

    return sameCategory && matchesQuery;
  });

  productGrid.innerHTML = filtered.map(p => {
    const price = getProductPrice(p);
    const oldPrice = getOldPrice(p);
    const onSale = isYes(p.sale) && p.salePrice > 0;

    const imageHtml = p.image
      ? `<div class="product-image"><img src="${safeText(p.image)}" alt="${safeText(p.name)}" loading="lazy" onerror="this.parentElement.innerHTML='${categoryIcon(p.category)}'"></div>`
      : `<div class="product-image">${categoryIcon(p.category)}</div>`;

    return `
      <article class="product-card">
        ${onSale ? '<span class="sale-badge">Акція</span>' : ''}

        <button class="product-card-main" type="button" data-product="${safeText(p.id)}">
          ${imageHtml}
          <div class="product-body">
            <span class="product-category">${safeText(p.category)}</span>
            <strong class="product-name">${safeText(p.name)}</strong>
            <p class="product-desc">${safeText(p.description)}</p>
          </div>
        </button>

        <div class="product-body" style="padding-top:0">
          <div class="product-bottom">
            <div class="price-wrap">
              <span class="price">${formatPrice(price)}</span>
              ${oldPrice ? `<span class="old-price">${formatPrice(oldPrice)}</span>` : ""}
            </div>
            <button class="add-btn" data-add="${safeText(p.id)}" type="button">+</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  productEmpty.hidden = filtered.length !== 0;

  if (!filtered.length) {
    productEmpty.textContent = q
      ? "Нічого не знайдено в цій категорії."
      : "У цій категорії поки немає активних товарів.";
  }
}

function saveCart() {
  localStorage.setItem("veloraCart", JSON.stringify(cart));
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

  return {count,total};
}

function renderCart() {
  const entries = Object.entries(cart).filter(([id, qty]) => Number(qty) > 0 && findProduct(id));

  cartItems.innerHTML = entries.map(([id, qty]) => {
    const p = findProduct(id);

    const thumb = p.image
      ? `<img src="${safeText(p.image)}" alt="">`
      : categoryIcon(p.category);

    return `
      <div class="cart-row">
        <div class="cart-thumb">${thumb}</div>
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

  const {count,total} = cartSummary();
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
  cartDrawer.setAttribute("aria-hidden","false");
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeCartDrawer() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden","true");
  overlay.hidden = true;
  document.body.style.overflow = "";
}

function openCheckout() {
  if (!cartSummary().count) return;
  closeCartDrawer();
  checkoutModal.classList.add("open");
  checkoutModal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}

function closeCheckoutModal() {
  checkoutModal.classList.remove("open");
  checkoutModal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function restoreRouteFromHash() {
  const hash = window.location.hash || "#home";

  if (hash.startsWith("#category=")) {
    const name = decodeURIComponent(hash.split("=").slice(1).join("="));
    if (findCategory(name)) {
      openCategory(name, false);
      return;
    }
  }

  if (hash.startsWith("#product=")) {
    const id = decodeURIComponent(hash.split("=").slice(1).join("="));
    if (findProduct(id)) {
      openProduct(id, false);
      return;
    }
  }

  if (hash === "#catalog") {
    setView("catalog");
    renderCategories();
    return;
  }

  if (hash === "#delivery") {
    setView("delivery");
    return;
  }

  setView("home");
}

document.addEventListener("click", e => {
  const route = e.target.closest("[data-route]");
  if (route) {
    routeTo(route.dataset.route);
    return;
  }

  const category = e.target.closest("[data-category]");
  if (category) {
    openCategory(category.dataset.category);
    return;
  }

  const product = e.target.closest("[data-product]");
  if (product) {
    openProduct(product.dataset.product);
    return;
  }

  const add = e.target.closest("[data-add]");
  if (add) {
    addToCart(add.dataset.add);
    return;
  }

  const detailAdd = e.target.closest("[data-detail-add]");
  if (detailAdd) {
    addToCart(detailAdd.dataset.detailAdd);
    return;
  }

  const backCategory = e.target.closest("[data-back-category]");
  if (backCategory) {
    openCategory(backCategory.dataset.backCategory);
  }
});

searchInput.addEventListener("input", renderProducts);

productCategoryBack.addEventListener("click", () => {
  if (currentCategory) openCategory(currentCategory);
});

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
  const {total} = cartSummary();

  const orderProducts = Object.entries(cart)
    .map(([id, quantity]) => {
      const p = findProduct(id);
      if (!p) return null;
      return {
        id:p.id,
        name:p.name,
        quantity:Number(quantity),
        price:getProductPrice(p)
      };
    })
    .filter(Boolean);

  const payload = {
    action:"order",
    name:data.get("name"),
    phone:data.get("phone"),
    city:data.get("city"),
    delivery:data.get("delivery"),
    comment:data.get("comment"),
    products:orderProducts,
    total
  };

  submitButton.disabled = true;
  submitButton.textContent = "Відправляємо…";

  try {
    const response = await fetch(API_URL, {
      method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Помилка відправлення");

    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Помилка API");

    cart = {};
    saveCart();
    renderCart();
    checkoutForm.reset();
    closeCheckoutModal();

    showToast(
      result.orderNumber
        ? `Замовлення ${result.orderNumber} оформлено ✓`
        : "Замовлення оформлено ✓"
    );
  } catch(error) {
    console.error(error);
    showToast("Не вдалося відправити замовлення");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Підтвердити замовлення";
  }
});

window.addEventListener("popstate", restoreRouteFromHash);

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeCartDrawer();
    closeCheckoutModal();
  }
});

loadStore();
