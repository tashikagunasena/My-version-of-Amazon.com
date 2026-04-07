import { cart, addToCart } from "../data/cart.js";
import { products } from "../data/products.js";

interface Rating {
  stars: number;
  count: number;
}

interface Product {
  id: string;
  name: string;
  image: string;
  priceCents: number;
  keywords: string[];
  rating: Rating;
}

interface CartItem {
  productId: string;
  quantity: number;
}

function getSearchQuery(): string {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("search") || "";
}

function filterProducts(
  products: Product[],
  searchTerm: string
): Product[] {
  if (!searchTerm.trim()) return products;

  const term = searchTerm.toLowerCase().trim();

  return products.filter((product) => {
    const nameMatch = product.name.toLowerCase().includes(term);
    const keywordMatch = product.keywords.some((keyword) =>
      keyword.toLowerCase().includes(term)
    );

    return nameMatch || keywordMatch;
  });
}

function renderProducts(productsToRender: Product[]): void {
  let productsHTML = "";

  productsToRender.forEach((product) => {
    productsHTML += `
      <div class="product-container">
        <div class="product-image-container">
          <img class="product-image" src="${product.image}" />
        </div>

        <div class="product-name limit-text-to-2-lines">
          ${product.name}
        </div>

        <div class="product-rating-container">
          <img
            class="product-rating-stars"
            src="images/ratings/rating-${product.rating.stars * 10}.png"
          />
          <div class="product-rating-count link-primary">
            ${product.rating.count}
          </div>
        </div>

        <div class="product-price">
          $${(product.priceCents / 100).toFixed(2)}
        </div>

        <div class="product-quantity-container">
          <select class="js-quantity-selector">
            ${[...Array(10)]
              .map((_, i) => `<option value="${i + 1}">${i + 1}</option>`)
              .join("")}
          </select>
        </div>

        <div class="product-spacer"></div>

        <div class="added-to-cart js-added-to-cart">
          <img src="images/icons/checkmark.png" />
          Added to cart
        </div>

        <button
          class="add-to-cart-button button-primary js-add-to-cart"
          data-product-id="${product.id}"
        >
          Add to Cart
        </button>
      </div>
    `;
  });

  const grid = document.querySelector(".js-products-grid") as HTMLElement;
  if (grid) grid.innerHTML = productsHTML;

  document.querySelectorAll(".js-add-to-cart").forEach((btn) => {
    const button = btn as HTMLButtonElement;

    button.addEventListener("click", () => {
      const productId = button.dataset.productId as string;

      const container = button.closest(".product-container") as HTMLElement;

      const quantitySelector = container.querySelector(
        ".js-quantity-selector"
      ) as HTMLSelectElement;

      const quantity = Number(quantitySelector.value);

      addToCart(productId, quantity);
      updateCart();

      const addedMessage = container.querySelector(
        ".js-added-to-cart"
      ) as HTMLElement;

      addedMessage.classList.add("added-to-cart-visible");

      setTimeout(() => {
        addedMessage.classList.remove("added-to-cart-visible");
      }, 2000);

      quantitySelector.value = "1";
    });
  });
}

function updateCart(): void {
  let cartQuantity = 0;

  (cart as CartItem[]).forEach((cartItem) => {
    cartQuantity += cartItem.quantity;
  });

  const cartEl = document.querySelector(".js-cart-quantity") as HTMLElement;
  if (cartEl) cartEl.innerHTML = cartQuantity.toString();
}

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

    if (query) {
      window.location.href = `index.html?search=${encodeURIComponent(query)}`;
    } else {
      window.location.href = "index.html";
    }
  };

  searchButton.addEventListener("click", executeSearch);

  searchInput.addEventListener("keypress", (e: KeyboardEvent) => {
    if (e.key === "Enter") executeSearch();
  });
}

const searchQuery: string = getSearchQuery();

const filteredProducts: Product[] = filterProducts(products, searchQuery);

renderProducts(filteredProducts);
updateCart();

if (searchQuery) {
  const searchInput = document.querySelector(
    ".search-bar"
  ) as HTMLInputElement | null;

  if (searchInput) searchInput.value = searchQuery;
}

setupSearch();
