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

// ---------- Modal for cancellation ----------
function createCancelModal(orderId, productId, productName) {
  // Remove any existing modal
  const existingModal = document.querySelector(".cancel-modal-overlay");
  if (existingModal) existingModal.remove();

  const overlay = document.createElement("div");
  overlay.className = "cancel-modal-overlay";

  const modal = document.createElement("div");
  modal.className = "cancel-modal";

  modal.innerHTML = `
    <div class="cancel-modal-header">
      <h3>Cancel Package</h3>
      <button class="cancel-modal-close">&times;</button>
    </div>
    <div class="cancel-modal-body">
      <p>Why do you want to cancel <strong>${productName}</strong>?</p>
      <div class="cancel-reasons">
        <label><input type="checkbox" value="Item arrived damaged"> Item arrived damaged</label>
        <label><input type="checkbox" value="Wrong item received"> Wrong item received</label>
        <label><input type="checkbox" value="Changed my mind"> Changed my mind</label>
        <div class="other-container">
          <label><input type="checkbox" value="Other" class="cancel-other-checkbox"> Other</label>
          <div class="cancel-other-input" style="display: none;">
            <input type="text" placeholder="Please specify..." class="cancel-other-text">
          </div>
        </div>
      </div>
      <div class="cancel-error" style="color: #d32f2f; font-size: 0.85rem; margin-top: 10px; display: none;">
        Please select a reason or specify in "Other".
      </div>
    </div>
    <div class="cancel-modal-footer">
      <button class="cancel-submit-btn button-primary">Submit Cancellation</button>
      <button class="cancel-close-btn button-secondary">Close</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close functions
  const closeModal = () => overlay.remove();
  modal
    .querySelector(".cancel-modal-close")
    .addEventListener("click", closeModal);
  modal
    .querySelector(".cancel-close-btn")
    .addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  // Show/hide other input
  const otherCheckbox = modal.querySelector(".cancel-other-checkbox");
  const otherInputDiv = modal.querySelector(".cancel-other-input");
  const otherText = modal.querySelector(".cancel-other-text");

  otherCheckbox.addEventListener("change", () => {
    otherInputDiv.style.display = otherCheckbox.checked ? "block" : "none";
    // Clear any existing error when user interacts
    const errorDiv = modal.querySelector(".cancel-error");
    if (errorDiv) errorDiv.style.display = "none";
  });

  // Submit cancellation with validation
  const submitBtn = modal.querySelector(".cancel-submit-btn");
  submitBtn.addEventListener("click", () => {
    const errorDiv = modal.querySelector(".cancel-error");
    errorDiv.style.display = "none";

    // Collect selected reasons
    const selectedReasons = Array.from(
      modal.querySelectorAll(".cancel-reasons input[type='checkbox']:checked"),
    ).map((cb) => cb.value);

    // If "Other" is checked and text is provided, add it
    let otherProvided = false;
    if (otherCheckbox.checked) {
      const otherValue = otherText.value.trim();
      if (otherValue) {
        selectedReasons.push(`Other: ${otherValue}`);
        otherProvided = true;
      }
    }

    // Validation: at least one reason OR (Other checked with text)
    const hasValidReason = selectedReasons.length > 0;

    if (!hasValidReason) {
      errorDiv.style.display = "block";
      return;
    }

    console.log("Cancellation reasons:", selectedReasons);

    // Remove the item from orders
    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex !== -1) {
      const order = orders[orderIndex];
      const itemIndex = order.items.findIndex((i) => i.productId === productId);
      if (itemIndex !== -1) {
        order.items.splice(itemIndex, 1);
        if (order.items.length === 0) {
          orders.splice(orderIndex, 1);
        }
        localStorage.setItem("orders", JSON.stringify(orders));
        closeModal();
        renderOrders(); // re-render orders grid
      } else {
        alert("Item not found in order.");
      }
    } else {
      alert("Order not found.");
    }
  });
}

// ---------- Render orders ----------
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
              <button class="cancel-package-button button-secondary" data-order-id="${order.id}" data-product-id="${item.productId}" data-product-name="${item.productName}">
                Cancel package
              </button>
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

  // Attach cancel package listeners
  document.querySelectorAll(".cancel-package-button").forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.dataset.orderId;
      const productId = button.dataset.productId;
      const productName = button.dataset.productName;
      createCancelModal(orderId, productId, productName);
    });
  });
}

// ---------- Search functionality ----------
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

// ---------- Initialization ----------
renderOrders();
updateCartQuantity();
setupSearch();
