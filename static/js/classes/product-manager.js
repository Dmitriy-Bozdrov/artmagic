export class ProductManager {
    constructor() {
        this.products = [];
        this.loadProductsFromStorage();
    }

    getProducts() {
        return this.products ?? [];
    }

    getStorageProducts() {
        const products = JSON.parse(localStorage.getItem("products"));
        return this.mapObjectsInProducts(products) ?? [];
    }

    setProducts(products) {
        this.products = products;
    }

    setStorageProducts(products) {
        localStorage.setItem("products", JSON.stringify(products));
    }

    deleteProduct(id) {
        this.products = this.products.filter((product) => product.id !== id);
        this.setStorageProducts(this.products)
    }

    clearProducts() {
        this.products = [];
    }

    clearStorageProducts() {
        localStorage.setItem('products', JSON.stringify([]));
    }

    async addProduct({ id, name, price, image, model, storageQuantity}) {
        
        const existProduct = this.existProduct(id);
        if (existProduct)
            existProduct.addOne();
        else {
            let preorder = 0;
            if(storageQuantity == 0)
                preorder = 1;
            const newProduct = new Product(id, name, price, image, model, null, preorder, storageQuantity);
            this.products = [...this.products, newProduct];
        }
        this.setStorageProducts(this.products)
        // console.log(this.isOrderedStoreProduct(), "isOrderedStoreProduct");
    }

    mapObjectsInProducts(products) {
        if (!products) return [];
        return products.map(({ id, name, price, quantity, image, model, preorder, storageQuantity }) =>
            new Product(id, name, price, image, model, quantity, preorder, storageQuantity)
        );
    }

    mapObjectInProduct({id, name, price, image, model, quantity, preorder, storageQuantity}) {
        if (!id) return null;
        return new Product(id, name, price, image, model, quantity, preorder, storageQuantity);
    }

    async fetchNewProduct(id) {
        const response = await fetch(`${PROTOCOL}://${HOST}:${PORT}/add-to-cart/?id=${id}`, {
            method: "GET",
            mode: "cors"
        });
        const product = await response.json();
        return product;
    }

    existProduct(id) {
        return this.products.find((product) => product.id === id) ?? null;
    }

    productsTotalCount() {
        return this.products.reduce((acc, cur) => acc + (Number(cur.quantity) || 0) + (Number(cur.preorder) || 0), 0);
    }

    currentProductTotalPrice(id, priceOutputFn, amountAfterQuote) {
        const curProduct = this.products.find((product) => product.id === id);
        return priceOutputFn(curProduct.quantity * curProduct.price, amountAfterQuote);
    }

    allProductsTotalPrice(priceOutputFn, amountAfterQuote) {
        return priceOutputFn(
            this.products.reduce((acc, cur) => acc + +this.currentProductTotalPrice(cur.id, priceOutputFn, amountAfterQuote), 0),
            amountAfterQuote
        );
    }

    priceOutputFn(number, amountAfterQuote) {
        return number.toFixed(amountAfterQuote);
    }

    setProductQuantity(id, value) {
        const curProduct = this.existProduct(id);
        curProduct.setQuantity(value);
    }

    loadProductsFromStorage() {
        this.setProducts(this.getStorageProducts());
    }

    
    filterProductsByQuantity(products) {
        return products.filter(product => product.quantity > 0 || product.preorder > 0);
    }

    getProductsInfo() {
        return this.products.map(({id, name, price, quantity}, i) => 
            `${i + 1}) Продукт 
             Назва: ${name}
             Ціна: ${price} грн
             Кільіксть: ${quantity}
             Ціна загальна: ${this.currentProductTotalPrice(id, this.priceOutputFn, 2)} грн`
        ).join('\n');
    }

    isOrderedStoreProduct(){
        return this.products.some(product => product.quantity > 0);
    }
    
}
