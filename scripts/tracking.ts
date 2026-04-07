import { cart, addToCart, saveCart } from "../data/cart.js";
import { formatCurrency } from "./utils/money.js";
import dayjs from "https://unpkg.com/supersimpledev@8.5.0/dayjs/esm/index.js";

// ---- Types ----
interface CartItem {
  productId: string;
  quantity: number;
}

interface OrderItem {
  productId: string;
  quantity: number;
  deliveryDateISO: string;
  productName: string;
  productImage: string;
  priceCents: number;
}

interface Order {
  id: string;
  items: OrderItem[];
}

// ---------- Update cart ----------
function updateCartQuantity(): void {
  let cartQuantity = 0;

  (cart as CartItem[]).forEach((item) => {
    cartQuantity += item.quantity;
  });

  const cartEl = document.querySelector(
    ".js-cart-quantity"
  ) as HTMLElement | null;

  if (cartEl) {
    cartEl.innerHTML = cartQuantity.toString();
  }
}

// ---------- Get query param ----------
function getQueryParam(param: string): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// ---------- Render tracking ----------
function renderTracking(): void {
  const orderId = getQueryParam("orderId");
  const productId = getQueryParam("productId");

  const container = document.querySelector(
    ".js-order-tracking"
  ) as HTMLElement | null;

  if (!container) return;

  if (!orderId || !productId) {
    container.innerHTML =
      '<div class="error">Invalid tracking link.</div>';
    return;
  }

  const orders: Order[] = JSON.parse(
    localStorage.getItem("orders") || "[]"
  );

  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    container.innerHTML =
      '<div class="error">Order not found.</div>';
    return;
  }

  const item = order.items.find(
    (i) => i.productId === productId
  );

  if (!item) {
    container.innerHTML =
      '<div class="error">Product not found in this order.</div>';
    return;
  }

  const deliveryDate = dayjs(item.deliveryDateISO);
  const today = dayjs();
  const daysUntilDelivery = deliveryDate.diff(today, "day");

  let progressPercent = 0;
  let statusLabel: "Preparing" | "Shipped" | "Delivered" = "Preparing";

  if (daysUntilDelivery < 0) {
    progressPercent = 100;
    statusLabel = "Delivered";
  } else if (daysUntilDelivery <= 3) {
    progressPercent = 66;
    statusLabel = "Shipped";
  } else {
    progressPercent = 33;
    statusLabel = "Preparing";
  }

  const formattedDeliveryDate = deliveryDate.format("dddd, MMMM D");
  const price = formatCurrency(item.priceCents);

  const trackingHtml = `
    <a class="back-to-orders-link link-primary" href="orders.html">
      View all orders
    </a>
    <div class="delivery-date">
      Arriving on ${formattedDeliveryDate}
    </div>
    <div class="product-info">
      ${item.productName}
    </div>
    <div class="product-info">
      Quantity: ${item.quantity}
    </div>
    <img class="product-image" src="${item.productImage}" />
    <div class="progress-labels-container">
      <div class="progress-label ${statusLabel === "Preparing" ? "current-status" : ""}">
        Preparing
      </div>
      <div class="progress-label ${statusLabel === "Shipped" ? "current-status" : ""}">
        Shipped
      </div>
      <div class="progress-label ${statusLabel === "Delivered" ? "current-status" : ""}">
        Delivered
      </div>
    </div>
    <div class="progress-bar-container">
      <div class="progress-bar" style="width: ${progressPercent}%;"></div>
    </div>
  `;

  container.innerHTML = trackingHtml;
}

// ---------- Search ----------
function setupSearch(): void {
  const searchInput = document.querySelector(
    ".search-bar"
  ) as HTMLInputElement | null;

  const searchButton = document.querySelector(
    ".search-button"
  ) as HTMLButtonElement | null;

  if (!searchInput || !searchButton) return;

  const executeSearch = () => {
    const query = searchInput.value.trim();

    window.location.href = query
      ? `index.html?search=${encodeURIComponent(query)}`
      : "index.html";
  };

  searchButton.addEventListener("click", executeSearch);

  searchInput.addEventListener("keypress", (e: KeyboardEvent) => {
    if (e.key === "Enter") executeSearch();
  });
}

// ---------- Init ----------
renderTracking();
updateCartQuantity();
setupSearch();
