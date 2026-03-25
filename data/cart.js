export let cart = [];

function loadCart() {
  const savedCart = localStorage.getItem("cart");
  if (savedCart) {
    cart = JSON.parse(savedCart);
    // Ensure each cart item has a deliveryOptionId, default to '1'
    cart.forEach((item) => {
      if (!item.deliveryOptionId) {
        item.deliveryOptionId = "1";
      }
    });
  } else {
    cart = [
      {
        productId: "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
        quantity: 2,
        deliveryOptionId: "1",
      },
      {
        productId: "15b6fc6f-327a-4ec4-896f-486349e85a3d",
        quantity: 1,
        deliveryOptionId: "1",
      },
    ];
  }
}

export function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

export function addToCart(productId, quantity) {
  let matchingItem = cart.find((item) => item.productId === productId);
  if (matchingItem) {
    matchingItem.quantity += quantity;
  } else {
    cart.push({
      productId,
      quantity,
      deliveryOptionId: "1", // default delivery option
    });
  }
  saveCart();
}

loadCart();
