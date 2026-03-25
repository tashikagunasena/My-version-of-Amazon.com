import { cart, addToCart, saveCart } from "../data/cart.js";
import { formatCurrency } from "./utils/money.js";
import dayjs from "https://unpkg.com/supersimpledev@8.5.0/dayjs/esm/index.js";

function updateCartQuantity() {
  let cartQuantity = 0;
  cart.forEach((item) => {
    cartQuantity += item.quantity;
  });
  document.querySelector(".js-cart-quantity").innerHTML = cartQuantity;
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function renderTracking() {
  const orderId = getQueryParam("orderId");
  const productId = getQueryParam("productId");

  if (!orderId || !productId) {
    document.querySelector(".js-order-tracking").innerHTML =
      '<div class="error">Invalid tracking link.</div>';
    return;
  }

  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const order = orders.find((o) => o.id === orderId);
  if (!order) {
    document.querySelector(".js-order-tracking").innerHTML =
      '<div class="error">Order not found.</div>';
    return;
  }

  const item = order.items.find((i) => i.productId === productId);
  if (!item) {
    document.querySelector(".js-order-tracking").innerHTML =
      '<div class="error">Product not found in this order.</div>';
    return;
  }

  const deliveryDate = dayjs(item.deliveryDateISO);
  const today = dayjs();
  const daysUntilDelivery = deliveryDate.diff(today, "day");

  let progressPercent = 0;
  let statusLabel = "Preparing";
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

  document.querySelector(".js-order-tracking").innerHTML = trackingHtml;
}

renderTracking();
updateCartQuantity();
