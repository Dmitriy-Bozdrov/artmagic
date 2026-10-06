//catalog header
const [productsBtn, promotionBtn] = document.querySelectorAll('.catalog-header-btn');
const catalogInfo = document.querySelector('.catalog-info');
const catalogProducts = document.querySelector('.catalog-products');

const toggleCatalogHeader = (e) => {
  if(e.target === productsBtn && !productsBtn.classList.contains("active")){
    productsBtn.classList.add("active");
    promotionBtn.classList.remove("active");
    catalogProducts.classList.add("active");
    catalogInfo.classList.remove("active");
  }
  if(e.target === promotionBtn && !promotionBtn.classList.contains("active")){
    promotionBtn.classList.add("active");
    productsBtn.classList.remove("active");
    catalogInfo.classList.add("active");
    catalogProducts.classList.remove("active");
  }
}

// for sidemenu
const openNav = () => {
  const nav = document.getElementById("mySidenav");
  const fullContent = document.querySelector('.full-content');
  const mobileHome = document.body.classList.contains("page-home") && window.innerWidth <= 900;
  nav.style.width = mobileHome ? "100%" : "400px";
  fullContent.style.marginLeft = mobileHome ? "0" : "400px";
  fullContent.style.opacity = mobileHome ? "1" : "0.8";
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0, and the background color of body to white */
const closeNav = () => {
  document.getElementById("mySidenav").style.width = "0";
  const fullContent = document.querySelector('.full-content');
  fullContent.style.marginLeft = "0";
  fullContent.style.opacity = "1";
  document.getElementById("mySidenav").style.opacity = "1";
}