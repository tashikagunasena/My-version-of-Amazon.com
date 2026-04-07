import { cart, addToCart, saveCart } from "../data/cart.js";
import { products } from "../data/products.js";
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
}

interface Order {
  id: string;
  placedDate: string;
  totalCents: number;
  items: OrderItem[];
}

// ---------- Update cart quantity ----------
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

// ---------- Modal for cancellation ----------
function createCancelModal(
  orderId: string,
  productId: string,
  productName: string
): void {
  const existingModal = document.querySelector(
    ".cancel-modal-overlay"
  );
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
      <div class="cancel-error" style="display:none;"></div>
    </div>
    <div class="cancel-modal-footer">
      <button class="cancel-submit-btn button-primary">Submit Cancellation</button>
      <button class="cancel-close-btn button-secondary">Close</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeModal = () => overlay.remove();

  (modal.querySelector(".cancel-modal-close") as HTMLElement)
    .addEventListener("click", closeModal);

  (modal.querySelector(".cancel-close-btn") as HTMLElement)
    .addEventListener("click", closeModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  const otherCheckbox = modal.querySelector(
    ".cancel-other-checkbox"
  ) as HTMLInputElement;

  const otherInputDiv = modal.querySelector(
    ".cancel-other-input"
  ) as HTMLElement;

  const otherText = modal.querySelector(
    ".cancel-other-text"
  ) as HTMLInputElement;

  otherCheckbox.addEventListener("change", () => {
    otherInputDiv.style.display = otherCheckbox.checked ? "block" : "none";

    const errorDiv = modal.querySelector(
      ".cancel-error"
    ) as HTMLElement;
    if (errorDiv) errorDiv.style.display = "none";
  });

  const submitBtn = modal.querySelector(
    ".cancel-submit-btn"
  ) as HTMLButtonElement;

  submitBtn.addEventListener("click", () => {
    const errorDiv = modal.querySelector(
      ".cancel-error"
    ) as HTMLElement;

    errorDiv.style.display = "none";

    const selectedReasons = Array.from(
      modal.querySelectorAll(
        ".cancel-reasons input[type='checkbox']:checked"
      )
    ).map((cb) => (cb as HTMLInputElement).value);

    if (otherCheckbox.checked) {
      const otherValue = otherText.value.trim();
      if (otherValue) {
        selectedReasons.push(`Other: ${otherValue}`);
      }
    }

    if (selectedReasons.length === 0) {
      errorDiv.style.display = "block";
      return;
    }

    let orders: Order[] = JSON.parse(
      localStorage.getItem("orders") || "[]"
    );

    const orderIndex = orders.findIndex((o) => o.id === orderId);

    if (orderIndex !== -1) {
      const order = orders[orderIndex];

      const itemIndex = order.items.findIndex(
        (i) => i.productId === productId
      );

      if (itemIndex !== -1) {
        order.items.splice(itemIndex, 1);

        if (order.items.length === 0) {
          orders.splice(orderIndex, 1);
        }

        localStorage.setItem("orders", JSON.stringify(orders));
        closeModal();
        renderOrders();
      } else {
        alert("Item not found in order.");
      }
    } else {
      alert("Order not found.");
    }
  });
}

// ---------- Render orders ----------
function renderOrders(): void {
  const orders: Order[] = JSON.parse(
    localStorage.getItem("orders") || "[]"
  );

  const ordersGrid = document.querySelector(
    ".js-orders-grid"
  ) as HTMLElement | null;

  if (!ordersGrid) return;

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
            "dddd, MMMM D"
          );

          return `
            <div class="product-image-container">
              <img src="${item.productImage}" />
            </div>
            <div class="product-details">
              <div class="product-name">${item.productName}</div>
              <div class="product-delivery-date">Arriving on: ${deliveryDate}</div>
              <div class="product-quantity">Quantity: ${item.quantity}</div>
              <button class="buy-again-button button-primary"
                data-product-id="${item.productId}"
                data-quantity="${item.quantity}">
                <span>Buy it again</span>
              </button>
            </div>
            <div class="product-actions">
              <a href="tracking.html?orderId=${order.id}&productId=${item.productId}">
                <button class="button-secondary">Track package</button>
              </a>
              <button class="cancel-package-button button-secondary"
                data-order-id="${order.id}"
                data-product-id="${item.productId}"
                data-product-name="${item.productName}">
                Cancel package
              </button>
            </div>
          `;
        })
        .join("");

      return `
        <div class="order-container">
          <div class="order-header">
            <div>
              <div>Order Placed:</div>
              <div>${orderDate}</div>
            </div>
            <div>
              <div>Total:</div>
              <div>$${total}</div>
            </div>
            <div>
              <div>Order ID:</div>
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

  document.querySelectorAll(".buy-again-button").forEach((btn) => {
    const button = btn as HTMLButtonElement;

    button.addEventListener("click", () => {
      const productId = button.dataset.productId as string;
      const quantity = Number(button.dataset.quantity);

      addToCart(productId, quantity);
      updateCartQuantity();

      alert(`${quantity} item(s) added to cart.`);
    });
  });

  document.querySelectorAll(".cancel-package-button").forEach((btn) => {
    const button = btn as HTMLButtonElement;

    button.addEventListener("click", () => {
      const orderId = button.dataset.orderId as string;
      const productId = button.dataset.productId as string;
      const productName = button.dataset.productName as string;

      createCancelModal(orderId, productId, productName);
    });
  });
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
renderOrders();
updateCartQuantity();
setupSearch();
