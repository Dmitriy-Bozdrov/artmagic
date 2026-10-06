import { formOrder } from "./order.js?v=2";

document.addEventListener("DOMContentLoaded", () => {
    const notification = document.getElementById('notification');
    const formContainer = document.querySelector('.order-choose__form');
    const btnSubmitOrder = document.querySelector(`[data-submit="btn_Order"]`);
    const paymentRealRadioInput = document.querySelector('#payment_real')
    const paymentRealRadioInputContainer = paymentRealRadioInput.parentElement;

    let selectedDelivery = null;
    let selectedPayment = null;

    // Функция для отображения или скрытия радио-кнопки "У точці видачі"
    const markSelected = (input) => {
        document.querySelectorAll(`input[name="${input.name}"]`).forEach((el) => {
            const label = document.querySelector(`label[for="${el.id}"]`);
            if (label) label.classList.toggle("is-selected", el.checked);
        });
    };

    const updatePaymentRealVisibility = () => {
        if (selectedDelivery === "artmagic_department") {
            paymentRealRadioInputContainer.classList.remove("d-none");
        } else {
            paymentRealRadioInputContainer.classList.add("d-none");
        }
        if (selectedDelivery !== "artmagic_department" && paymentRealRadioInput.checked) {
            paymentRealRadioInput.checked = false;
            markSelected(paymentRealRadioInput);
            formOrder.setSelectedPayment(null);
            selectedPayment = null;
        }
    };



    const updateNotification = () => {
        switch (true) {
            case !selectedDelivery && !selectedPayment:
                notification.textContent = 'Будь ласка, оберіть спосіб доставки й оплати.';
                disableSubmitButton();
                break;
            case !selectedDelivery:
                notification.textContent = 'Будь ласка, оберіть спосіб доставки.';
                disableSubmitButton();
                break;
            case !selectedPayment:
                notification.textContent = 'Будь ласка, оберіть спосіб оплати.';
                disableSubmitButton();
                break;
            default:
                notification.textContent = '';
                enableSubmitButton();
                break;
        }
    };
    
    const disableSubmitButton = () => {
        btnSubmitOrder.setAttribute('disabled', 'disabled');
    };
    
    const enableSubmitButton = () => {
        btnSubmitOrder.removeAttribute('disabled');
    };
    updateNotification();

    const iconsDelivery = document.querySelectorAll('[data-delivery]');

    const orderInputWrap = (fieldName) => document.querySelector(`[data-field="${fieldName}"]`).parentElement;
    const orderInputWraps = document.querySelectorAll('.order__input__wrap');
    orderInputWraps.forEach((inputWrap) => inputWrap.classList.add('d-block'));

    const show = (el) => {
        el.classList.remove('d-none');
        el.classList.add('d-block');
    }

    const hide = (el) => {
        el.classList.remove('d-block');
        el.classList.add('d-none');
    }

    const removeDeliveryActiveClass = () => {
        iconsDelivery.forEach((icon) => {
            const typeOfIcon = icon.dataset.delivery;
            switch (typeOfIcon) {
                case "artmagic_department":
                    icon.setAttribute("src", "/static/assets/basket-icons/artmagic.png");
                    break;
                case "new_post_department":
                case "new_post_packing":
                case "new_post_address":
                    icon.classList.remove('c11');
                    icon.classList.add('c8');
                    break;
                case "ukr_post":
                    icon.classList.remove('c20');
                    icon.classList.add('c8');
                    break;
                    
            }
        });
    }

    const applyDeliveryVisual = (type) => {
        removeDeliveryActiveClass();
        const icon = document.querySelector(`[data-delivery="${type}"]`);
        if (!icon) return;
        switch (type) {
            case "artmagic_department":
                icon.setAttribute("src", "/static/assets/logo/artmagic.png");
                break;
            case "new_post_department":
            case "new_post_packing":
            case "new_post_address":
                icon.classList.remove("c8");
                icon.classList.add("c11");
                break;
            case "ukr_post":
                icon.classList.remove("c8");
                icon.classList.add("c20");
                break;
        }
    };

    document.querySelectorAll('input[name="delivery"]').forEach((input) => {
        input.addEventListener("change", () => {
            if (!input.checked) return;
            selectedDelivery = input.id;
            formOrder.setSelectedDelivery(selectedDelivery);
            applyDeliveryVisual(selectedDelivery);
            markSelected(input);
            updatePaymentRealVisibility();
            updateNotification();
            clearDepartmentQuery();
            updateFormFields();
        });
    });

    const iconsPayment = document.querySelectorAll('[data-payment]');

    const removePaymentActiveClass = () => {
        iconsPayment.forEach((icon) => {
            const typeOfIcon = icon.dataset.payment;
            switch (typeOfIcon) {
                case "liqpay":
                    const pathesLiqpay = icon.children[0].children;
                    pathesLiqpay[0].classList.remove("c14");
                    for (let i = 1; i <= 2; i++) {
                        pathesLiqpay[i].classList.remove("c23");
                        pathesLiqpay[i].classList.add("c6");
                    }
                    break;
                case "payment_card":
                    icon.classList.remove("c20");
                    icon.classList.add("c8");
                    break;
                case "payment_real":
                    icon.setAttribute("src", "/static/assets/basket-icons/oplata-kartoy_grey.png");
                    break;
            }
        });
    }

    const applyPaymentVisual = (type) => {
        removePaymentActiveClass();
        const icon = document.querySelector(`[data-payment="${type}"]`);
        if (!icon) return;
        switch (type) {
            case "liqpay":
                const pathesLiqpay = icon.children[0].children;
                pathesLiqpay[0].classList.add("c14");
                for (let i = 1; i <= 2; i++) {
                    pathesLiqpay[i].classList.remove("c6");
                    pathesLiqpay[i].classList.add("c23");
                }
                break;
            case "payment_card":
                icon.classList.remove("c8");
                icon.classList.add("c20");
                break;
            case "payment_real":
                icon.setAttribute("src", "/static/assets/basket-icons/oplata-kartoy.png");
                break;
        }
    };

    document.querySelectorAll('input[name="payment"]').forEach((input) => {
        input.addEventListener("change", () => {
            if (!input.checked) return;
            selectedPayment = input.id;
            formOrder.setSelectedPayment(selectedPayment);
            applyPaymentVisual(selectedPayment);
            markSelected(input);
            updateNotification();
            updateFormFields();
        });
    });

    document.querySelectorAll(".order-choose label.card-input__icon-wrap").forEach((label) => {
        label.addEventListener("click", () => {
            const input = document.getElementById(label.htmlFor);
            if (!input || input.checked) return;
            input.checked = true;
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
    });

    const departmentSelect = document.querySelector('[data-field="department"]');
    const departmentQuery = document.querySelector(".department-picker__query");
    const departmentList = document.querySelector(".department-picker__list");
    let departmentActiveIndex = -1;

    const closeDepartmentList = () => {
        departmentList.hidden = true;
        departmentList.innerHTML = "";
        departmentActiveIndex = -1;
    };

    const clearDepartmentQuery = () => {
        departmentQuery.value = "";
        closeDepartmentList();
    };

    const departmentOptions = () => [...departmentSelect.options].filter((option) => option.value && option.value !== "null");

    const chooseDepartment = (option) => {
        departmentSelect.value = option.value;
        departmentQuery.value = option.textContent;
        departmentSelect.dispatchEvent(new Event("input", { bubbles: true }));
        departmentSelect.dispatchEvent(new Event("change", { bubbles: true }));
        closeDepartmentList();
    };

    const renderDepartmentMatches = () => {
        const query = departmentQuery.value.trim().toLowerCase();
        departmentList.innerHTML = "";
        departmentActiveIndex = -1;
        if (!query) {
            closeDepartmentList();
            return;
        }

        const options = departmentOptions();
        departmentList.hidden = false;
        if (!options.length) {
            departmentList.innerHTML = `<li class="department-picker__empty">Спочатку оберіть місто</li>`;
            return;
        }

        const matches = options.filter((option) => option.textContent.toLowerCase().includes(query)).slice(0, 12);
        if (!matches.length) {
            departmentList.innerHTML = `<li class="department-picker__empty">Нічого не знайдено</li>`;
            return;
        }

        matches.forEach((option) => {
            const item = document.createElement("li");
            const button = document.createElement("button");
            button.type = "button";
            button.className = "department-picker__option";
            button.textContent = option.textContent;
            button.addEventListener("mousedown", (event) => event.preventDefault());
            button.addEventListener("click", () => chooseDepartment(option));
            item.appendChild(button);
            departmentList.appendChild(item);
        });
        document.querySelector(".basket__modal__swiper")?.swiper?.update();
    };

    departmentQuery.addEventListener("input", () => {
        const selected = departmentSelect.selectedOptions[0];
        if (departmentSelect.value && departmentSelect.value !== "null" && departmentQuery.value !== selected?.textContent) {
            departmentSelect.value = "null";
            departmentSelect.dispatchEvent(new Event("input", { bubbles: true }));
        }
        renderDepartmentMatches();
    });

    departmentQuery.addEventListener("keydown", (event) => {
        const buttons = [...departmentList.querySelectorAll(".department-picker__option")];
        if (event.key === "Escape") {
            closeDepartmentList();
            return;
        }
        if (!buttons.length || !["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) return;
        event.preventDefault();
        if (event.key === "ArrowDown") departmentActiveIndex = Math.min(departmentActiveIndex + 1, buttons.length - 1);
        if (event.key === "ArrowUp") departmentActiveIndex = Math.max(departmentActiveIndex - 1, 0);
        if (event.key === "Enter") {
            (buttons[departmentActiveIndex] || buttons[0]).click();
            return;
        }
        buttons.forEach((button, index) => button.classList.toggle("is-active", index === departmentActiveIndex));
        buttons[departmentActiveIndex]?.scrollIntoView({ block: "nearest" });
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".department-picker")) closeDepartmentList();
    });

    new MutationObserver(() => {
        clearDepartmentQuery();
    }).observe(departmentSelect, { childList: true });

    const updateFormFields = () => {
        const fieldsToShow = [];

        if (selectedDelivery === "ukr_post") {
            fieldsToShow.push("fullName", "clientPhone", "address", "email");
        }
        if(selectedDelivery === "artmagic_department"){
            fieldsToShow.push("fullName", "clientPhone", "email");
        }
        if (selectedDelivery === "new_post_packing" || selectedDelivery === "new_post_department") {
            fieldsToShow.push("fullName", "clientPhone", "area", "city", "email", "department");
            departmentQuery.placeholder = selectedDelivery === "new_post_packing"
                ? "Номер або адреса поштомата"
                : "Номер або адреса відділення";
        }
        if (selectedDelivery === "new_post_address" ){
            fieldsToShow.push("fullName", "clientPhone","address", "area", "city", "email");
        }




        formOrder.userAuthDefaultData()


        orderInputWraps.forEach((wrap) => {
            const fieldName = wrap.querySelector('.order__input').dataset.field;
            if (fieldsToShow.includes(fieldName)) {
                show(wrap);
            } else {
                hide(wrap);
            }
        });
    };

    // Initialize form fields with null values
    const initializeFormFields = () => {
        document.querySelector('[data-field="fullName"]').value = '';
        document.querySelector('[data-field="clientPhone"]').value = '';
        document.querySelector('[data-field="email"]').value = '';
        document.querySelector('[data-field="address"]').value = '';
        document.querySelector('[data-field="area"]').value = 'null';
        document.querySelector('[data-field="city"]').value = 'null';
    };

    updatePaymentRealVisibility(); // Обновить видимость "У точці видачі"
    initializeFormFields();
    updateFormFields();
});




