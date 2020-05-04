const client = contentful.createClient({
	space: 'jvq1mamk1dx5',
	accessToken: 'dH4zQgeDbbrUTd0gj19rWYYJGxYCnjqpIblzW2M9aBw',
	host: 'preview.contentful.com'
});

const cartBtn = document.querySelector('.cart-btn');
const closeCartBtn = document.querySelector('.close-cart');
const clearCartBtn = document.querySelector('.clear-cart');
const cartDOM = document.querySelector('.cart');
const cartOverlay = document.querySelector('.cart-overlay');
const cartItems = document.querySelector('.cart-items');
const cartTotal = document.querySelector('.cart-total');
const cartContent = document.querySelector('.cart-content');
const productsDOM = document.querySelector('.products-center');

//cart state
let cart = [];
let buttonsDOM = [];
//getting the products from API, something like DAL
class ProductsAPI {
	async getProducts() {
		try {
			let contentful = await client.getEntries({
				content_type: 'shopApp'
			});

			let items = contentful.items;
			items = items.map((item) => {
				const { title, price } = item.fields;
				const id = item.sys.id;
				const image = item.fields.image.fields.file.url;
				return { title, price, id, image };
			});
			return items;
		} catch (err) {
			//need more explanations for users
			console.log(err);
		}
	}
}

// UI re-render
class UI {
	displayProducts(products) {
		let result = '';
		products.forEach((products) => {
			result += `<article class="product">
            <div class="img-container">
                <img src=${products.image} alt="product" class="product-img">
                <button class="bag-btn" data-id= ${products.id}>
                    <i class="fas fa-shopping-cart"></i>add to cart
                </button>
            </div>
            <h3>${products.title}</h3>
            <h4>$${products.price}</h4>
        </article>
                `;
		});
		productsDOM.innerHTML = result;
	}
	getBagButtons() {
		const buttons = [ ...document.querySelectorAll('.bag-btn') ];
		buttonsDOM = buttons;
		buttons.forEach((button) => {
			let id = button.dataset.id;
			let inCart = cart.find((item) => item.id === id);
			if (inCart) {
				button.innerText = 'In Cart';
				button.disabled = true;
			} else {
				button.addEventListener('click', (event) => {
					let button = event.target;
					button.innerText = 'In Cart';
					button.disabled = true;
					debugger;
					let cartItem = { ...Store.getProduct(id), amount: 1 };
					cart = [ ...cart, cartItem ];
					//save cart into local store
					Store.saveCart(cart);
					this.setCartValues(cart);
					this.addCartItem(cartItem);
				});
			}
		});
	}

	addCartItem(item) {
		const div = document.createElement('div');
		div.classList.add('cart-item');
		div.innerHTML = `<img src=${item.image} alt="product">
		<div>
			<h4>${item.title}</h4>
			<h5>$${item.price}</h5>
			<span class="remove-item" data-id=${item.id}>remove</span>
		</div>
		<div>
			<i class="fas fa-chevron-up" data-id=${item.id}></i>
			<p class="item-amount">${item.amount}</p>
			<i class="fas fa-chevron-down" data-id=${item.id}></i>
		</div>`;

		cartContent.appendChild(div);
	}

	showCart() {
		cartOverlay.classList.add('transparentBcg');
		cartDOM.classList.add('showCart');
	}

	closeCart() {
		cartOverlay.classList.remove('transparentBcg');
		cartDOM.classList.remove('showCart');
	}

	setupAPP() {
		cart = Store.getCart();
		this.setCartValues(cart);
		this.populateCart(cart);
		//DANGEROUS THIS USES --> close button side bar
		cartBtn.addEventListener('click', this.showCart);
		closeCartBtn.addEventListener('click', this.closeCart);
	}

	populateCart(cart) {
		cart.forEach((item) => this.addCartItem(item));
	}

	setCartValues(cart) {
		let currentTotal = 0;
		let itemsTotal = 0;
		cart.map((item) => {
			currentTotal += item.price * item.amount;
			itemsTotal += item.amount;
		});
		cartTotal.innerText = parseFloat(currentTotal.toFixed(2));
		cartItems.innerHTML = itemsTotal;
	}
	cartLogic() {
		clearCartBtn.addEventListener('click', () => this.clearCart());
		//action with products in cart
		cartContent.addEventListener('click', (event) => this.cartAction(event));
	}

	cartAction(event) {
		if (event.target.classList.contains('remove-item')) {
			let removeItem = event.target;
			let id = removeItem.dataset.id;
			//remove from dump
			cartContent.removeChild(removeItem.parentElement.parentElement);
			this.removeItem(id);
		} else if (event.target.classList.contains('fa-chevron-up')) {
			let addAmount = event.target;
			let id = addAmount.dataset.id;
			let tempItem = cart.find((item) => item.id === id);
			tempItem.amount = tempItem.amount + 1;
			Store.saveCart(cart);
			this.setCartValues(cart);
			addAmount.nextElementSibling.innerText = tempItem.amount;
		} else if (event.target.classList.contains('fa-chevron-down')) {
			let lowerAmount = event.target;
			let id = lowerAmount.dataset.id;
			let tempItem = cart.find((item) => item.id === id);
			tempItem.amount = tempItem.amount - 1;
			if (tempItem.amount > 0) {
				Store.saveCart(cart);
				this.setCartValues(cart);
				lowerAmount.previousElementSibling.innerText = tempItem.amount;
			} else {
				cartContent.removeChild(lowerAmount.parentElement.parentElement);
				this.removeItem(id);
			}
		}
	}

	clearCart() {
		let cartItems = cart.map((item) => item.id);
		cartItems.forEach((id) => this.removeItem(id));
		cartContent.innerHTML = '';
		// while (cartContent.children.length > 0) {
		// 	cartContent.removeChild(cartContent.children[0]);
		// }
		this.closeCart();
	}

	removeItem(id) {
		cart = cart.filter((item) => item.id !== id);
		this.setCartValues(cart);
		Store.saveCart(cart);
		let button = this.getSingleButton(id);
		button.disabled = false;
		button.innerHTML = `<i class='fas fa-shopping-cart'></i>add to cart`;
	}

	getSingleButton(id) {
		return buttonsDOM.find((button) => button.dataset.id === id);
	}
}

// local store or BLL
class Store {
	static cashProducts(products) {
		localStorage.setItem('products', JSON.stringify(products));
	}
	static getProduct(id) {
		let products = JSON.parse(localStorage.getItem('products'));
		return products.find((product) => product.id === id);
	}
	static saveCart(cart) {
		debugger;
		localStorage.setItem('cart', JSON.stringify(cart));
	}
	static getCart() {
		return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
	}
}

//something like React Reducer
document.addEventListener('DOMContentLoaded', () => {
	const ui = new UI();
	const products = new ProductsAPI();
	//setup all application
	ui.setupAPP();
	//get products
	products
		.getProducts()
		.then((products) => {
			ui.displayProducts(products);
			Store.cashProducts(products);
		})
		.then(() => {
			ui.getBagButtons();
			ui.cartLogic();
		});
});
