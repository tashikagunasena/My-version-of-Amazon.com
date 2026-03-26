import { cart, addToCart, saveCart } from "../data/cart.js";
import { products } from "../data/products.js";
import { formatCurrency } from "./utils/money.js";
import dayjs from "https://unpkg.com/supersimpledev@8.5.0/dayjs/esm/index.js";

function updateCartQuantity() {
  let cartQuantity = 0;
  cart.forEach((item) => {
    cartQuantity += item.quantity;
  });
  document.querySelector(".js-cart-quantity").innerHTML = cartQuantity;
}

function renderOrders() {
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const ordersGrid = document.querySelector(".js-orders-grid");

  if (orders.length === 0) {
    ordersGrid.innerHTML =
      '<div class="empty-orders">You have no orders.</div>';
    return;
  }

  ordersGrid.innerHTML = orders
    .map((order) => {
      const orderDate = dayjs(order.placedDate).format("MMMM D");
      const total = formatCurrency(order.totalCents);

      const itemsHtml = order.items
        .map((item) => {
          const deliveryDate = dayjs(item.deliveryDateISO).format(
            "dddd, MMMM D",
          );
          return `
            <div class="product-image-container">
              <img src="${item.productImage}" />
            </div>
            <div class="product-details">
              <div class="product-name">${item.productName}</div>
              <div class="product-delivery-date">Arriving on: ${deliveryDate}</div>
              <div class="product-quantity">Quantity: ${item.quantity}</div>
              <button class="buy-again-button button-primary" data-product-id="${item.productId}" data-quantity="${item.quantity}">
                <img class="buy-again-icon" src="images/icons/buy-again.png" />
                <span class="buy-again-message">Buy it again</span>
              </button>
            </div>
            <div class="product-actions">
              <a href="tracking.html?orderId=${order.id}&productId=${item.productId}">
                <button class="track-package-button button-secondary">Track package</button>
              </a>
            </div>
          `;
        })
        .join("");

      return `
        <div class="order-container">
          <div class="order-header">
            <div class="order-header-left-section">
              <div class="order-date">
                <div class="order-header-label">Order Placed:</div>
                <div>${orderDate}</div>
              </div>
              <div class="order-total">
                <div class="order-header-label">Total:</div>
                <div>$${total}</div>
              </div>
            </div>
            <div class="order-header-right-section">
              <div class="order-header-label">Order ID:</div>
              <div>${order.id}</div>
            </div>
          </div>
          <div class="order-details-grid">
            ${itemsHtml}
          </div>
        </div>
      `;
    })
    .join("");

  // Attach buy again listeners
  document.querySelectorAll(".buy-again-button").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.dataset.productId;
      const quantity = parseInt(button.dataset.quantity);
      addToCart(productId, quantity);
      updateCartQuantity();
      alert(`${quantity} item(s) added to cart.`);
    });
  });
}

// --- Search functionality ---
function setupSearch() {
  const searchInput = document.querySelector(".search-bar");
  const searchButton = document.querySelector(".search-button");

  if (!searchInput || !searchButton) return;

  const executeSearch = () => {
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `index.html?search=${encodeURIComponent(query)}`;
    } else {
      window.location.href = "index.html";
    }
  };

  searchButton.addEventListener("click", executeSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") executeSearch();
  });
}

// --- Initialization ---
renderOrders();
updateCartQuantity();
setupSearch();
