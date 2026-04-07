import { cart, saveCart } from "../data/cart.js";
import { products } from "../data/products.js";
import { formatCurrency } from "./utils/money.js";
import { deliveryOptions } from "../data/deliveryOptions.js";
import dayjs from "https://unpkg.com/supersimpledev@8.5.0/dayjs/esm/index.js";

interface CartItem {
  productId: string;
  quantity: number;
  deliveryOptionId: string;
}

interface Product {
  id: string;
  name: string;
  image: string;
  priceCents: number;
}

interface DeliveryOption {
  id: string;
  deliveryDays: number;
  priceCents: number;
}

interface OrderItem {
  productId: string;
  quantity: number;
  deliveryOptionId: string;
  deliveryDateISO: string;
  productName: string;
  productImage: string;
  priceCents: number;
}

interface Order {
  id: string;
  placedDate: string;
  totalCents: number;
  items: OrderItem[];
}

function getDeliveryOption(deliveryOptionId: string): DeliveryOption {
  const option = deliveryOptions.find(
    (option) => option.id === deliveryOptionId
  );

  if (!option) {
    throw new Error(`Delivery option not found: ${deliveryOptionId}`);
  }

  return option;
}

function formatDate(daysFromNow: number): string {
  const date = dayjs().add(daysFromNow, "day");
  return date.format("dddd, MMMM D");
}

function renderCheckout(): void {
  let cartSummaryHTML = "";
  let cartQuantity = 0;
  let subtotalCents = 0;
  let shippingTotalCents = 0;

  const orderSummaryEl = document.querySelector(
    ".js-order-summery"
  ) as HTMLElement | null;

  const returnToHomeEl = document.querySelector(
    ".return-to-home-link"
  ) as HTMLElement | null;

  if (!orderSummaryEl || !returnToHomeEl) return;

  if (cart.length === 0) {
    orderSummaryEl.innerHTML =
      '<div class="empty-cart">Your cart is empty.</div>';
    returnToHomeEl.innerHTML = "0 items";

    const paymentRows = document.querySelectorAll(
      ".payment-summary .payment-summary-money"
    );

    if (paymentRows.length) {
      paymentRows.forEach((row) => {
        (row as HTMLElement).innerHTML = "$0.00";
      });
    }

    const itemsCountDiv = document.getElementById("js-items-count");
    if (itemsCountDiv) {
      itemsCountDiv.innerHTML = `Items (0):`;
    }

    return;
  }

  cart.forEach((cartItem: CartItem) => {
    const product = products.find(
      (p: Product) => p.id === cartItem.productId
    ) as Product | undefined;

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
                (option: DeliveryOption) => `
              <div class="delivery-option">
                <input type="radio"
                  class="delivery-option-input"
                  name="delivery-option-${cartItem.productId}"
                  value="${option.id}"
                  ${cartItem.deliveryOptionId === option.id ? "checked" : ""}>
                <div>
                  <div class="delivery-option-date">${formatDate(
                    option.deliveryDays
                  )}</div>
                  <div class="delivery-option-price">
                    ${option.priceCents === 0 ? "FREE Shipping" : `$${formatCurrency(option.priceCents)} - Shipping`}
                  </div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  });

  orderSummaryEl.innerHTML = cartSummaryHTML;
  returnToHomeEl.innerHTML = `${cartQuantity} items`;

  const itemsCountDiv = document.getElementById("js-items-count");
  if (itemsCountDiv) {
    itemsCountDiv.innerHTML = `Items (${cartQuantity}):`;
  }

  const taxCents = subtotalCents * 0.1;
  const totalCents = subtotalCents + shippingTotalCents + taxCents;

  const paymentRows = document.querySelectorAll(
    ".payment-summary .payment-summary-row"
  );

  if (paymentRows.length >= 5) {
    const row0 = paymentRows[0].querySelector(
      ".payment-summary-money"
    ) as HTMLElement | null;
    const row1 = paymentRows[1].querySelector(
      ".payment-summary-money"
    ) as HTMLElement | null;
    const row2 = paymentRows[2].querySelector(
      ".payment-summary-money"
    ) as HTMLElement | null;
    const row3 = paymentRows[3].querySelector(
      ".payment-summary-money"
    ) as HTMLElement | null;
    const row4 = paymentRows[4].querySelector(
      ".payment-summary-money"
    ) as HTMLElement | null;

    if (row0) row0.innerHTML = `$${formatCurrency(subtotalCents)}`;
    if (row1) row1.innerHTML = `$${formatCurrency(shippingTotalCents)}`;
    if (row2) row2.innerHTML = `$${formatCurrency(subtotalCents + shippingTotalCents)}`;
    if (row3) row3.innerHTML = `$${formatCurrency(taxCents)}`;
    if (row4) row4.innerHTML = `$${formatCurrency(totalCents)}`;
  }

  document.querySelectorAll(".update-quantity-link").forEach((link) => {
    link.addEventListener("click", () => {
      const productId = (link as HTMLElement).dataset.productId;
      const newQuantity = prompt("Enter new quantity (1-99):", "1");

      if (!productId || newQuantity === null) return;

      const parsedQuantity = Number(newQuantity);

      if (!Number.isNaN(parsedQuantity) && parsedQuantity > 0) {
        const cartItem = (cart as CartItem[]).find(
          (item) => item.productId === productId
        );

        if (cartItem) {
          cartItem.quantity = parsedQuantity;
          saveCart();
          renderCheckout();
        }
      }
    });
  });

  document.querySelectorAll(".delete-quantity-link").forEach((link) => {
    link.addEventListener("click", () => {
      const productId = (link as HTMLElement).dataset.productId;
      if (!productId) return;

      const index = (cart as CartItem[]).findIndex(
        (item) => item.productId === productId
      );

      if (index !== -1) {
        cart.splice(index, 1);
        saveCart();
        renderCheckout();
      }
    });
  });

  document.querySelectorAll(".delivery-option-input").forEach((radio) => {
    radio.addEventListener("change", () => {
      const radioInput = radio as HTMLInputElement;
      const container = radioInput.closest(".cart-item-container") as HTMLElement | null;
      if (!container) return;

      const productId = container.dataset.productId;
      if (!productId) return;

      const newOptionId = radioInput.value;

      const cartItem = (cart as CartItem[]).find(
        (item) => item.productId === productId
      );

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
const placeOrderButton = document.querySelector(
  ".place-order-button"
) as HTMLButtonElement | null;

placeOrderButton?.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Your cart is empty. Add items before placing an order.");
    return;
  }

  const orderId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const orderItems: OrderItem[] = [];
  let orderTotalCents = 0;

  (cart as CartItem[]).forEach((cartItem) => {
    const product = products.find(
      (p: Product) => p.id === cartItem.productId
    ) as Product | undefined;

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

  const shippingTotalCents = (cart as CartItem[]).reduce((sum, cartItem) => {
    const deliveryOption = getDeliveryOption(cartItem.deliveryOptionId);
    return sum + deliveryOption.priceCents;
  }, 0);

  const taxCents = orderTotalCents * 0.1;
  const totalCents = orderTotalCents + shippingTotalCents + taxCents;

  const order: Order = {
    id: orderId,
    placedDate: new Date().toISOString(),
    totalCents,
    items: orderItems,
  };

  const storedOrders = localStorage.getItem("orders");
  const existingOrders: Order[] = storedOrders ? JSON.parse(storedOrders) : [];

  existingOrders.push(order);
  localStorage.setItem("orders", JSON.stringify(existingOrders));

  cart.length = 0;
  saveCart();

  window.location.href = "orders.html";
});
