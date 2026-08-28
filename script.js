const products = [
  { id: 1, name: "Зволожувальний крем", category: "Обличчя", price: 429, icon: "🧴", desc: "Щоденний крем для м’якої та зволоженої шкіри." },
  { id: 2, name: "Сироватка Glow", category: "Обличчя", price: 519, icon: "✨", desc: "Легка сироватка для сяйва та рівного тону." },
  { id: 3, name: "Тінт для губ", category: "Макіяж", price: 289, icon: "💄", desc: "Стійкий відтінок із комфортним покриттям." },
  { id: 4, name: "Туш Volume", category: "Макіяж", price: 349, icon: "👁️", desc: "Виразний об’єм і подовження без грудочок." },
  { id: 5, name: "Маска для волосся", category: "Волосся", price: 399, icon: "🪮", desc: "Живлення, м’якість і блиск по всій довжині." },
  { id: 6, name: "Олія для кінчиків", category: "Волосся", price: 319, icon: "💧", desc: "Згладжує та допомагає захистити сухі кінчики." },
  { id: 7, name: "Крем для тіла", category: "Тіло", price: 359, icon: "🌿", desc: "Ніжна текстура та комфорт після душу." },
  { id: 8, name: "Цукровий скраб", category: "Тіло", price: 299, icon: "🫧", desc: "Делікатне відлущення та гладкість шкіри." },
  { id: 9, name: "Velora Bloom", category: "Парфуми", price: 899, icon: "🌸", desc: "Ніжний квітково-мускусний аромат." },
  { id: 10, name: "Velora Nude", category: "Парфуми", price: 949, icon: "🤍", desc: "Теплий чистий аромат на кожен день." },
  { id: 11, name: "Glow Set", category: "Набори", price: 999, icon: "🎁", desc: "Готовий набір для базового щоденного догляду." },
  { id: 12, name: "Soft Ritual Set", category: "Набори", price: 1199, icon: "🎀", desc: "Ніжний подарунковий набір для beauty-ритуалу." }
];

let activeFilter = "Усі";
let cart = JSON.parse(localStorage.getItem("veloraCart") || "{}");

const productGrid = document.getElementById("productGrid");
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
  return new Intl.NumberFormat("uk-UA").format(value) + " грн";
}

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = products.filter(p => {
    const fitsCategory = activeFilter === "Усі" || p.category === activeFilter;
    const fitsQuery = !query ||
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.desc.toLowerCase().includes(query);

    return fitsCategory && fitsQuery;
  });

  productGrid.innerHTML = filtered.map(p => `
    <article class="product-card">
      <div class="product-image">${p.icon}</div>
      <div class="product-body">
        <span class="product-category">${p.category}</span>
        <strong class="product-name">${p.name}</strong>
        <p class="product-desc">${p.desc}</p>
        <div class="product-bottom">
          <span class="price">${formatPrice(p.price)}</span>
          <button class="add-btn" data-add="${p.id}" type="button" aria-label="Додати ${p.name}">+</button>
        </div>
      </div>
    </article>
  `).join("");

  emptyState.hidden = filtered.length !== 0;
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
    const p = products.find(item => item.id === Number(id));
    if (!p) continue;
    count += qty;
    total += p.price * qty;
  }
  return { count, total };
}

function renderCart() {
  const entries = Object.entries(cart).filter(([id, qty]) =>
    qty > 0 && products.some(p => p.id === Number(id))
  );

  cartItems.innerHTML = entries.map(([id, qty]) => {
    const p = products.find(item => item.id === Number(id));
    return `
      <div class="cart-row">
        <div class="cart-thumb">${p.icon}</div>
        <div>
          <strong>${p.name}</strong>
          <small>${formatPrice(p.price)}</small>
          <div class="qty">
            <button type="button" data-minus="${p.id}">−</button>
            <span>${qty}</span>
            <button type="button" data-plus="${p.id}">+</button>
          </div>
        </div>
        <button class="remove-btn" type="button" data-remove="${p.id}">Видалити</button>
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
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

productGrid.addEventListener("click", e => {
  const btn = e.target.closest("[data-add]");
  if (btn) addToCart(Number(btn.dataset.add));
});

filters.addEventListener("click", e => {
  const btn = e.target.closest("[data-filter]");
  if (!btn) return;

  activeFilter = btn.dataset.filter;
  document.querySelectorAll(".filter").forEach(el => el.classList.remove("active"));
  btn.classList.add("active");
  renderProducts();
});

document.querySelectorAll("[data-category]").forEach(btn => {
  btn.addEventListener("click", () => {
    activeFilter = btn.dataset.category;
    document.querySelectorAll(".filter").forEach(el => {
      el.classList.toggle("active", el.dataset.filter === activeFilter);
    });
    renderProducts();
    document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
  });
});

searchInput.addEventListener("input", renderProducts);

cartItems.addEventListener("click", e => {
  const minus = e.target.closest("[data-minus]");
  const plus = e.target.closest("[data-plus]");
  const remove = e.target.closest("[data-remove]");

  if (minus) changeQty(Number(minus.dataset.minus), -1);
  if (plus) changeQty(Number(plus.dataset.plus), 1);
  if (remove) removeFromCart(Number(remove.dataset.remove));
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

checkoutForm.addEventListener("submit", e => {
  e.preventDefault();

  const data = new FormData(checkoutForm);
  const { total } = cartSummary();

  // Тут пізніше підключимо реальне відправлення замовлення
  // у Telegram / Google Sheets / email.
  console.log("VELORA order", {
    customer: Object.fromEntries(data.entries()),
    cart,
    total
  });

  cart = {};
  saveCart();
  renderCart();
  checkoutForm.reset();
  closeCheckoutModal();
  showToast("Замовлення оформлено ✓");
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeCartDrawer();
    closeCheckoutModal();
  }
});

renderProducts();
renderCart();
