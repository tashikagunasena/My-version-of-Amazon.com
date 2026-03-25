import { cart, saveCart } from "../data/cart.js";
import { products } from "../data/products.js";
import { formatCurrency } from "./utils/money.js";
import { deliveryOptions } from "../data/deliveryOptions.js";
import dayjs from "https://unpkg.com/supersimpledev@8.5.0/dayjs/esm/index.js";

function getDeliveryOption(deliveryOptionId) {
  return deliveryOptions.find((option) => option.id === deliveryOptionId);
}

function formatDate(daysFromNow) {
  const date = dayjs().add(daysFromNow, "day");
  return date.format("dddd, MMMM D");
}

function renderCheckout() {
  let cartSummaryHTML = "";
  let cartQuantity = 0;
  let subtotalCents = 0;
  let shippingTotalCents = 0;

  if (cart.length === 0) {
    document.querySelector(".js-order-summery").innerHTML =
      '<div class="empty-cart">Your cart is empty.</div>';
    document.querySelector(".return-to-home-link").innerHTML = "0 items";
    const paymentRows = document.querySelectorAll(
      ".payment-summary .payment-summary-money",
    );
    if (paymentRows.length) {
      paymentRows.forEach((row) => (row.innerHTML = "$0.00"));
    }
    // Update items label to 0
    const itemsCountDiv = document.getElementById("js-items-count");
    if (itemsCountDiv) {
      itemsCountDiv.innerHTML = `Items (0):`;
    }
    return;
  }

  cart.forEach((cartItem) => {
    const product = products.find((p) => p.id === cartItem.productId);
    if (!product) return;

    const deliveryOption = getDeliveryOption(cartItem.deliveryOptionId);
    const deliveryDate = formatDate(deliveryOption.deliveryDays);

    cartQuantity += cartItem.quantity;
    subtotalCents += product.priceCents * cartItem.quantity;
    shippingTotalCents += deliveryOption.priceCents;

    cartSummaryHTML += `
      <div class="cart-item-container" data-product-id="${cartItem.productId}">
        <div class="delivery-date">Delivery date: ${deliveryDate}</div>
        <div class="cart-item-details-grid">
          <img class="product-image" src="${product.image}">
          <div class="cart-item-details">
            <div class="product-name">${product.name}</div>
            <div class="product-price">$${formatCurrency(product.priceCents)}</div>
            <div class="product-quantity">
              <span>Quantity: <span class="quantity-label">${cartItem.quantity}</span></span>
              <span class="update-quantity-link link-primary" data-product-id="${cartItem.productId}">Update</span>
              <span class="delete-quantity-link link-primary" data-product-id="${cartItem.productId}">Delete</span>
            </div>
          </div>
          <div class="delivery-options">
            <div class="delivery-options-title">Choose a delivery option:</div>
            ${deliveryOptions
              .map(
                (option) => `
              <div class="delivery-option">
                <input type="radio"
                  class="delivery-option-input"
                  name="delivery-option-${cartItem.productId}"
                  value="${option.id}"
                  ${cartItem.deliveryOptionId === option.id ? "checked" : ""}>
                <div>
                  <div class="delivery-option-date">${formatDate(option.deliveryDays)}</div>
                  <div class="delivery-option-price">
                    ${option.priceCents === 0 ? "FREE Shipping" : `$${formatCurrency(option.priceCents)} - Shipping`}
                  </div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  });

  document.querySelector(".js-order-summery").innerHTML = cartSummaryHTML;
  document.querySelector(".return-to-home-link").innerHTML =
    `${cartQuantity} items`;

  // Update the "Items (X):" text in the payment summary
  const itemsCountDiv = document.getElementById("js-items-count");
  if (itemsCountDiv) {
    itemsCountDiv.innerHTML = `Items (${cartQuantity}):`;
  }

  const taxCents = subtotalCents * 0.1;
  const totalCents = subtotalCents + shippingTotalCents + taxCents;

  const paymentRows = document.querySelectorAll(
    ".payment-summary .payment-summary-row",
  );
  if (paymentRows.length >= 5) {
    paymentRows[0].querySelector(".payment-summary-money").innerHTML =
      `$${formatCurrency(subtotalCents)}`;
    paymentRows[1].querySelector(".payment-summary-money").innerHTML =
      `$${formatCurrency(shippingTotalCents)}`;
    paymentRows[2].querySelector(".payment-summary-money").innerHTML =
      `$${formatCurrency(subtotalCents + shippingTotalCents)}`;
    paymentRows[3].querySelector(".payment-summary-money").innerHTML =
      `$${formatCurrency(taxCents)}`;
    paymentRows[4].querySelector(".payment-summary-money").innerHTML =
      `$${formatCurrency(totalCents)}`;
  }

  // Attach event listeners for quantity updates
  document.querySelectorAll(".update-quantity-link").forEach((link) => {
    link.addEventListener("click", () => {
      const productId = link.dataset.productId;
      const newQuantity = prompt("Enter new quantity (1-99):", "1");
      if (newQuantity && !isNaN(newQuantity) && parseInt(newQuantity) > 0) {
        const cartItem = cart.find((item) => item.productId === productId);
        if (cartItem) {
          cartItem.quantity = parseInt(newQuantity);
          saveCart();
          renderCheckout();
        }
      }
    });
  });

  document.querySelectorAll(".delete-quantity-link").forEach((link) => {
    link.addEventListener("click", () => {
      const productId = link.dataset.productId;
      const index = cart.findIndex((item) => item.productId === productId);
      if (index !== -1) {
        cart.splice(index, 1);
        saveCart();
        renderCheckout();
      }
    });
  });

  document.querySelectorAll(".delivery-option-input").forEach((radio) => {
    radio.addEventListener("change", (event) => {
      const container = radio.closest(".cart-item-container");
      const productId = container.dataset.productId;
      const newOptionId = radio.value;

      const cartItem = cart.find((item) => item.productId === productId);
      if (cartItem) {
        cartItem.deliveryOptionId = newOptionId;
        saveCart();
        renderCheckout();
      }
    });
  });
}

renderCheckout();

// ---------- Place Order ----------
document.querySelector(".place-order-button").addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Your cart is empty. Add items before placing an order.");
    return;
  }

  // Generate order ID
  const orderId = Date.now() + "-" + Math.random().toString(36).substr(2, 8);

  // Prepare order items
  const orderItems = [];
  let orderTotalCents = 0;

  cart.forEach((cartItem) => {
    const product = products.find((p) => p.id === cartItem.productId);
    if (!product) return;

    const deliveryOption = getDeliveryOption(cartItem.deliveryOptionId);
    const deliveryDate = dayjs().add(deliveryOption.deliveryDays, "day");

    const itemTotal = product.priceCents * cartItem.quantity;
    orderTotalCents += itemTotal;

    orderItems.push({
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      deliveryOptionId: cartItem.deliveryOptionId,
      deliveryDateISO: deliveryDate.toISOString(),
      productName: product.name,
      productImage: product.image,
      priceCents: product.priceCents,
    });
  });

  // Add shipping and tax
  const shippingTotalCents = cart.reduce((sum, cartItem) => {
    const deliveryOption = getDeliveryOption(cartItem.deliveryOptionId);
    return sum + deliveryOption.priceCents;
  }, 0);
  const taxCents = orderTotalCents * 0.1;
  const totalCents = orderTotalCents + shippingTotalCents + taxCents;

  const order = {
    id: orderId,
    placedDate: new Date().toISOString(),
    totalCents: totalCents,
    items: orderItems,
  };

  // Save order to localStorage
  const existingOrders = JSON.parse(localStorage.getItem("orders")) || [];
  existingOrders.push(order);
  localStorage.setItem("orders", JSON.stringify(existingOrders));

  // Clear cart
  cart.length = 0;
  saveCart();

  // Redirect to orders page
  window.location.href = "orders.html";
});
