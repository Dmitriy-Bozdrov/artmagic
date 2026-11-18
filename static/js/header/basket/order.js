import { productManager, basket } from "./basket.js?v=5";
import "../../../node_modules/bootstrap/dist/js/bootstrap.bundle.js";
import { basketModalCarousel } from "../header.js?v=2";
const { MIN_2_LETTERS_UA, FIRST_LETTER_CAPITALISE_UA, EMAIL, PHONE_UA, REQUIRED, POSTAL_INDEX }  = regexp;

const formDataOrder = {
    fullName: "",
    clientPhone: "",
    email: "",
    address: "",
    area: "",
    city: "",
    department: "",
}

// Не забувати, що патерни можуть перекривати один одного
const SELECTED_OPTION = /^(?!null$).+/;
const NAME_LETTERS = /[A-Za-zА-Яа-яЁёІіЇїЄєҐґ]{2,}/;

const patternsOrder = {
    fullName: [
        { rule: NAME_LETTERS, errorMsg: "Мінімум 2 літери" },
    ],
    email: [
        { rule: EMAIL, errorMsg: "Неправильний email" }
    ],
    clientPhone: [
        { rule: PHONE_UA, errorMsg: "Неправильний номер телефону" }
    ],
    address: [
        { rule:  MIN_2_LETTERS_UA, errorMsg: "Мінімум 2 літери UA"},
    ],
    area: [
        { rule: SELECTED_OPTION, errorMsg: "Оберіть область" },
    ],
    city: [
        { rule: SELECTED_OPTION, errorMsg: "Оберіть місто" },
    ],
    department: [
        { rule: SELECTED_OPTION, errorMsg: "Оберіть відділення або поштомат" },
    ],
};

basket.renderBasket();

const userData = new Map();

Array.from(document.querySelectorAll("[data-user]")).map(el => {
    const key = el.dataset.user;
    const val = el.textContent;
    userData.set(key, val)
    return userData
});


export const formOrder = new Form(formDataOrder, patternsOrder, "Order", Alert,  productManager, basket, userData, bootstrap, basketModalCarousel);

formOrder.initForm("orderForm", {
    fullName: "name",
    email: "email",
    clientPhone: "phone",
    city: "city",
    address: "address",
    area: "area",
    products: "products",
    department: "department",
}, "cart/checkout/", "POST",
    {successMessage: "Ваше замовлення успішно прийняте", errorMessage: "Якась помилка"},
    3000, true
);

