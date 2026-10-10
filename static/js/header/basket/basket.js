import { Basket } from "../../classes/basket.js?v=4";
import { ProductManager } from "../../classes/product-manager.js?v=4"; 

export const productManager = new ProductManager();
export const basket = new Basket(productManager);



