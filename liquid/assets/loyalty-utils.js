window.Loyalty = class Loyalty {
  constructor(host, options = {}) {
    // Adding data as props to library
    this.setProp = (propName) => {
      const that = this;
      const obj = {
        name: propName,
        internal: {},
        set data(val) {
          that.setter(this, val);
        },
        get data() {
          return that.getter(this);
        },
      };
      return obj;
    };

    this.setter = (self, val) => {
      self.internal = val;
      this.saveItem(self.name, val);
    };

    this.getter = (self) => {
      self.internal = this.getSavedItem(self.name);
      return self.internal;
    };
    // Data handling on localStorage
    this.getSavedItem = (savedItem) => {
      return JSON.parse(localStorage.getItem(savedItem));
    };

    this.saveItem = (itemName, item) => {
      localStorage.setItem(itemName, JSON.stringify(item));
    };

    this.deleteItem = (obj) => {
      localStorage.removeItem(obj.name);
      obj = null;
    };

    // HTML class handling
    this.selectEl = (selector) => {
      let el;
      if (typeof selector === "string") {
        el = document.querySelector(selector);
      } else {
        el = selector;
      }
      return el;
    };

    this.toggleClass = (selector, className) => {
      const el = this.selectEl(selector);
      el.classList.toggle(className);
    };

    this.toggleClass = (selector, className) => {
      const el = this.selectEl(selector);
      el.classList.toggle(className);
    };

    this.addClass = (selector, className) => {
      const el = this.selectEl(selector);
      el.classList.add(className);
    };

    this.removeClass = (selector, className) => {
      const el = this.selectEl(selector);
      el.classList.remove(className);
    };

    this.addShowClass = (selector) => {
      const el = this.selectEl(selector);
      this.addClass(el, "show");
    };

    this.removeShowClass = (selector) => {
      const el = this.selectEl(selector);
      this.removeClass(el, "show");
    };

    // HTML manipulation
    this.changeInnerText = (selector, text) => {
      const el = this.selectEl(selector);
      el.innerText = text;
      if (el.tagName === "INPUT") {
        el.value = text;
      }
    };

    // Loyalty API
    this.saveMemberBonus = (result, bonusSelector) => {
      const bonusEl = document.querySelector(bonusSelector);
      const { member, availableBonus } = result;
      this.availableBonus.data = availableBonus;
      this.member.data = member;
      bonusEl.innerText = availableBonus;
    };

    this.getMemberBonus = (price) => {
      // url for getting member and bonus by phone
      price = price * 0.01;
      if (price <= 0) price = 0.00001;
      const url = `${this.HOST}/loyall/programs/members/byphone/${this.shop.data}?phoneNumber=${this.member.data.phoneNumber}&price=${price}`;
      return this.getData(url).then((res) => {
        this.availableBonus.data = res.availableBonus;
        this.member.data = res.member;
        this.productBonus.data = res.productBonus;
        return res;
      });
    };

    this.authenticate = (tag) => {
      const rawPrice =
        tag === "product"
          ? this.product.data.price
          : this.cart.data.items_subtotal_price;
      const price = rawPrice <= 0 ? 0.00001 : rawPrice * 0.01;

      // show spinner
      this.addShowClass(`.spinner-${tag}`);

      // IF LOGGED IN
      // if (token) => verify token => then:
      // check if auth token is valid
      const token = this.token.data;
      if (token) {
        const verifyTokenUrl = `${this.HOST}/api/verify-auth-token-get-data`;
        this.postData(verifyTokenUrl, {
          token,
          price,
        })
          .then((res) => {
            if (res.status === 200) {
              if (res.memberId) {
                // if member
                this.availableBonus.data = res.availableBonus;
                this.productBonus.data = res.productBonus;
                this.member.data = {
                  memberId: res.memberId,
                  phoneNumber: res.phoneNumber,
                };
                this.updateBonusHtml(tag);
                // show AUTHENTICATED div
                this.addShowClass(`.auth-${tag}`);
                this.removeShowClass(`.noAuth-${tag}`);
                this.removeShowClass(`.spinner-${tag}`);
                console.log("Is member.");
              } else {
                // if not member
                // show AUTHENTICATED div
                this.updateBonusHtml(tag);
                this.addShowClass(`.auth-${tag}-not-member`);
                this.removeShowClass(`.noAuth-${tag}`);
                this.removeShowClass(`.auth-${tag}`);
                this.removeShowClass(`.spinner-${tag}`);
                console.log("Is NOT member.");
              }
            } else if (res.status === 401) {
              // if token expired or invalid
              this.deleteItem(this.token);
              console.log("token deleted");
              this.showNoAuth(tag);
              this.showPhoneVerificationBox(tag);
              this.updateBonusHtml(tag);
            }
          })
          .catch((err) => {
            console.log("some verification error", err);
            this.deleteItem(this.token);
            this.showNoAuth(tag);
            this.showPhoneVerificationBox(tag);
            this.updateBonusHtml(tag);
          });
      } else {
        // IF NOT LOGGED IN
        this.showNoAuth(tag);
        this.showPhoneVerificationBox(tag);
        this.setDefaultMerchantBonus(tag);
        this.updateBonusHtml(tag);
      }
    };

    this.showNoAuth = (tag) => {
      // show noAuth div
      this.addShowClass(`.noAuth-${tag}`);
      this.removeShowClass(`.auth-${tag}`);
      this.removeShowClass(`.auth-${tag}-not-member`);
      this.removeShowClass(`.spinner-${tag}`);
    };

    // set an interval to check for product variant change
    // and set product in local storage
    this.setVariantInterval = () => {
      let selectedVariant = window.location.search;
      return setInterval(() => {
        if (window.location.search !== selectedVariant) {
          selectedVariant = window.location.search;
          const variantId = selectedVariant.replace("?variant=", "");
          const { origin, pathname } = window.location;
          this.getData(origin + pathname + ".js").then((res) => {
            this.product.data = res.variants.find(
              (v) => `${v.id}` === variantId
            );
            this.authenticate("product");
          });
        }
      }, 2000);
    };

    this.tjenBonus = (event, tag) => {
      event.preventDefault();
      const inputEl = document.querySelector(`.login-form-${tag}`);
      this.addShowClass(inputEl);
      this.removeShowClass(event.target);
      this.removeShowClass(`.verification-wrapper-${tag}`);
    };

    this.submitLoginForm = (event, tag) => {
      // html el
      const phoneNumberEl = document.querySelector(`#phone-number-${tag}`);
      const countryCodeEl = document.querySelector(`#country-code-${tag}`);
      const phoneNumber = countryCodeEl.value + phoneNumberEl.value;

      const url = `${this.HOST}/loyall/programs/members/createverificationcode/${this.shop.data}`;

      this.removeShowClass(`.login-form-${tag}`);
      this.addShowClass(`.spinner-${tag}`);
      this.postData(url, {
        phoneNumber,
        expiresIn: 600,
        language: "en",
      }).then((res) => {
        // after recieving member from api
        this.member.data = { phoneNumber };
        if (res.status === 200) {
          this.removeShowClass(`.spinner-${tag}`);
          this.changeInnerText(
            `.verification-wrapper-${tag} #phone`,
            "+" + phoneNumber
          );
          this.changeInnerText(`.tjen-bonus-btn-${tag}`, "Change phone number");
          this.addShowClass(`.tjen-bonus-btn-${tag}`);
          this.addShowClass(`.verification-wrapper-${tag}`);
        }
      });
    };

    this.submitVerificationCode = (event, tag) => {
      event.preventDefault();
      const codeEl = document.querySelector(`#code-${tag}`);
      const resultEl = document.querySelector(`#verify-result-${tag}`);
      const verifyBtn = document.querySelector(`.verify-code-btn-${tag}`);
      const againBtn = document.querySelector(`.again-code-btn-${tag}`);
      const url = `${this.HOST}/loyall/programs/members/verifyverificationcode/${this.shop.data}`;
      verifyBtn.disabled = true;
      this.changeInnerText(verifyBtn, "Verifying...");

      let { phoneNumber } = this.member.data;

      this.postData(url, {
        phoneNumber,
        code: codeEl.value,
      })
        .then((res) => {
          let text = "";
          if (res?.token) {
            // SUCCESSFULL VERIFICATION
            // received token
            this.token.data = res.token;
            // save memberId to localStorage
            this.member.data = {
              memberId: res.memberId,
              phoneNumber,
            };
            text = "Code successfully verified!";
            resultEl.style.color = "green";
            this.changeInnerText(resultEl, text);
            this.verified.data = true;
            // show auth after 2 sec
            this.addShowClass(`.spinner-${tag}`);
            this.authenticate(tag);
            setTimeout(() => {
              this.changeInnerText(verifyBtn, "Verify code");
              verifyBtn.disabled = false;
              this.changeInnerText(resultEl, "");
            }, 5000);
          } else {
            // FAILED VERIFICATION
            const { message } = res;
            text = message;
            this.changeInnerText(resultEl, text);
            resultEl.style.color = "red";
            this.verified.data = false;
            againBtn.disabled = false;
            verifyBtn.disabled = false;
            this.changeInnerText(verifyBtn, "Verify code");
          }
        })
        .catch((e) => console.error(e));
    };

    // resend verification code
    this.resendVerificationCode = (tag) => {
      const againBtn = document.querySelector(`.again-code-btn-${tag}`);
      againBtn.addEventListener("click", () => {
        againBtn.disabled = true;
        const url = `${this.HOST}/loyall/programs/members/createverificationcode/${this.shop.data}`;
        const loyaltyMember = JSON.parse(
          localStorage.getItem("loyalty-member")
        );
        let { phoneNumber } = loyaltyMember;
        this.postData(url, {
          phoneNumber,
          expiresIn: 600,
          language: "en",
        })
          .then((res) => {
            if (res.status === 200) {
              this.changeInnerText(
                againBtn,
                "Code sent! Please check your phone."
              );
              console.log("SMS sent!");
              setTimeout(() => {
                this.changeInnerText(againBtn, "Receive code again");
                againBtn.disabled = false;
              }, 10000);
            }
          })
          .catch((e) => {
            againBtn.disabled = false;
            console.log(e);
          });
      });
    };

    /**
     * Get default bonus percentage for product/cart subtotal price
     * @param {String} tag either 'product' or 'cart'
     * @returns price
     */
    this.setDefaultMerchantBonus = (tag) => {
      // product price was set in the file: loyalty-product.liquid
      // cart price was set in initCartPage
      const rawPrice =
        tag === "product"
          ? this.product.data.price
          : this.cart.data.items_subtotal_price;
      const price = rawPrice <= 0 ? 0.00001 : rawPrice * 0.01;
      // get default product bonus for merchant
      const defaultBonusUrl = `${this.HOST}/loyall/merchants/orderbonus/${this.shop.data}?price=${price}`;
      this.getData(defaultBonusUrl).then((res) => {
        // set default bonus
        this.productBonus.data = res;
        this.updateBonusHtml(tag);
      });

      return price;
    };

    this.updateBonusHtml = (tag) => {
      // update bonus amount and bonus percent
      this.changeInnerText(
        `.title__bonus-amount-${tag}`,
        this.formatMoney(Number(this.productBonus.data.bonusAmount.toFixed(2)))
      );
      this.changeInnerText(
        `.bonus-percent-${tag}`,
        this.productBonus.data.bonusPercent
      );
      if (tag === "cart") {
        if (this.availableBonus?.data)
          this.changeInnerText(
            ".available-loyalty-bonus",
            this.formatMoney(this.availableBonus.data)
          );
      }
    };

    /* --- Product page --- */
    this.initProductPage = () => {
      // set interval for checking product variant change
      const variantInterval = this.setVariantInterval();

      // update earned bonus amount form merchant
      const price = this.setDefaultMerchantBonus("product");

      this.authenticate("product");

      // add event listender to resend code button
      this.resendVerificationCode("product");
    };

    this.showPhoneVerificationBox = (tag) => {
      const loyaltyMember = this.member.data;
      let phoneNumber = loyaltyMember?.phoneNumber
        ? loyaltyMember.phoneNumber
        : "";

      // show verification box
      if (phoneNumber) {
        this.changeInnerText(
          `.verification-wrapper-${tag} #phone`,
          "+" + phoneNumber
        );
        this.changeInnerText(`.tjen-bonus-btn-${tag}`, "Change phone number");
        this.addShowClass(`.verification-wrapper-${tag}`);
      }
    };

    /* --- Cart page --- */
    this.getCart = async () => {
      // get cart from api
      const url = window.location.origin + "/cart.js";
      const cart = await this.getData(url);
      // set cart in localStorage
      this.cart.data = cart;
      // set cartItems in localStorage
      const cartItems = [];
      cart.items.forEach((item, idx) => {
        cartItems.push(item.id, item.quantity);
      });
      this.cartItems.data = cartItems;
      return cart;
    };

    this.initBonus = () => {
      // get bonus percent from local storage, otherwise set 15%
      const productBonus = this.productBonus
        ? this.productBonus.data
        : undefined;
      const bonusPercent = productBonus?.bonusPercent
        ? productBonus.bonusPercent
        : 15;

      // calculate and set cart bonus
      const cartSubtotal = this.cart?.data?.items_subtotal_price || 0;
      this.cartBonus.data = cartSubtotal * bonusPercent;

      // calculate discounted cart value
      const discount = this.discountCode?.data?.discount_value || 0;
      const discountedPrice = this.cart.data.total_price - discount;

      // get bonus info from localStorage before sending req to api
      const initialAvailableBonus = this.formatMoney(this.availableBonus?.data);
      const initialBonusToEarn = this.formatMoney(
        Number(bonusPercent * discountedPrice * 0.0001).toFixed(2)
      );
      this.changeInnerText(".available-loyalty-bonus", initialAvailableBonus);
      this.changeInnerText(".title__bonus-amount-cart", initialBonusToEarn);

      return discountedPrice;
    };

    this.initCartPage = () => {
      // get cart data from Shpify cart api
      const url = window.location.origin + "/cart.js";
      this.getData(url).then((res) => {
        // set cart to localStorage
        this.cart.data = res;

        this.setDefaultMerchantBonus("cart");

        // save cart items to localStorage
        const { items } = this.cart.data;
        const cartItems = [];
        items.forEach((item) => {
          cartItems.push(item.id, item.quantity);
        });
        this.cartItems.data = cartItems;

        // take care of authentication
        this.authenticate("cart");

        // add event listender to resend code button
        this.resendVerificationCode("cart");

        // apply bonus
        // if discount code exists
        if (this.discountCode?.data) {
          // check if discount code is used once already
          const { id, price_rule_id } = this.discountCode.data;
          this.getData(
            `${this.HOST}/discounts/discount_code/${this.shop.data}/${price_rule_id}/${id}`
          )
            .then(async (res) => {
              // compare expriry date with now
              const d1 = new Date();
              const d2 = new Date(res.ends_at);
              const isValidDiscountCode =
                d1 < d2 && res.discount_code?.usage_count < 1;

              if (isValidDiscountCode) {
                //
                const discountCode = this.discountCode.data.code;

                // apply bonus
                await fetch(
                  `https://${this.shop.data}/discount/${discountCode}`
                );

                const bonusAmountEl = document.querySelector(
                  ".apply-bonus-form-input"
                );
                const bonusLabelEl = document.querySelector(
                  ".apply-bonus-form-label"
                );
                const discountCodeEl = document.querySelector(
                  ".your-discount-code"
                );
                const discountTextEl = document.querySelector(
                  ".your-discount-code-text"
                );
                const discountSubmitBtn = document.querySelector(
                  "#apply-bonus-form-submit-btn"
                );
                this.removeShowClass(bonusAmountEl);
                this.removeShowClass(bonusLabelEl);
                this.addShowClass(discountTextEl);
                this.changeInnerText(discountCodeEl, `${discountCode} `);
                discountSubmitBtn.value = this.DELETE_BONUS;
              } else {
                // delete discount code
                this.deleteData(
                  `${this.HOST}/discounts/discount_codes/${this.shop.data}/${price_rule_id}/${id}`
                )
                  .then((res) => {
                    this.discountCode.data = "";
                    this.authenticate("cart");
                  })
                  .catch((e) => {
                    this.discountCode.data = "";
                    this.authenticate("cart");
                  });
              }
            })
            .catch((e) => {
              this.discountCode.data = "";
              this.authenticate("cart");
            });
        }
      });
      // check for cart changes
      this.setCartInterval();
    };

    this.submitApplyBonusForm = (e) => {
      e.preventDefault();
      // html el
      const bonusAmountEl = document.querySelector(".apply-bonus-form-input");
      const bonusLabelEl = document.querySelector(".apply-bonus-form-label");
      const discountCodeEl = document.querySelector(".your-discount-code");
      const discountTextEl = document.querySelector(".your-discount-code-text");
      const discoutnValueErrorEl = document.querySelector(
        "#discount-value-error"
      );
      const discountSubmitBtn = document.querySelector(
        "#apply-bonus-form-submit-btn"
      );

      discountSubmitBtn.disabled = true;

      // Apply Bonus btn
      if (discountSubmitBtn.value === this.APPLY_BONUS) {
        const discountValue = Number(bonusAmountEl.value);
        const validation = this.validateDiscountValue(discountValue);
        // check if entered amount is valid
        if (validation.isValid) {
          this.addShowClass(".spinner-cart");
          this.changeInnerText(discoutnValueErrorEl, "");

          const url = `${this.HOST}/discounts/discount_codes`;
          this.postData(url, {
            discountValue,
            token: this.token.data,
            memberId: this.member.data.id,
          }).then(async (res) => {
            if (res.status === 401) {
              const tag = "cart";
              // if token expired or invalid
              this.deleteItem(this.token);
              console.log("token deleted");
              this.showNoAuth(tag);
              this.showPhoneVerificationBox(tag);
              this.updateBonusHtml(tag);
            }
            const discountCode = res.code;
            if (discountCode) {
              // got discount code from backend
              // apply bonus
              await fetch(`https://${this.shop.data}/discount/${discountCode}`);
              this.discountCode.data = res;
              this.removeShowClass(bonusAmountEl);
              this.removeShowClass(bonusLabelEl);
              this.addShowClass(discountTextEl);
              this.changeInnerText(discountCodeEl, `${discountCode} `);
              discountSubmitBtn.value = this.DELETE_BONUS;
              discountSubmitBtn.disabled = false;
              this.authenticate("cart");
            }
          });
        } else {
          this.changeInnerText(discoutnValueErrorEl, validation.errorMessage);
          bonusAmountEl.value = validation.value;
          discountSubmitBtn.disabled = false;
        }
      }
      // Change Bonus btn
      else {
        this.changeBonusAmount();
      }
    };

    this.changeBonusAmount = () => {
      const bonusAmountEl = document.querySelector(".apply-bonus-form-input");
      const bonusLabelEl = document.querySelector(".apply-bonus-form-label");
      const discountTextEl = document.querySelector(".your-discount-code-text");
      const discountSubmitBtn = document.querySelector(
        "#apply-bonus-form-submit-btn"
      );
      const discountCode = this.discountCode.data;
      const { price_rule_id, reservationReference } = discountCode;
      const delUrl = `${this.HOST}/discounts/price_rules/${this.shop.data}/${price_rule_id}/${reservationReference}`;
      this.deleteData(delUrl).then((res) => {
        this.removeShowClass(discountTextEl);
        this.addShowClass(bonusLabelEl);
        this.addShowClass(bonusAmountEl);
        discountSubmitBtn.value = this.APPLY_BONUS;
        discountSubmitBtn.disabled = false;
        this.discountCode.data = "";
        this.authenticate("cart");
      });
    };

    this.validateDiscountValue = (value) => {
      const availableBonus = this.availableBonus.data;
      const subtotal = Number(
        this.cart.data.items_subtotal_price * 0.01
      ).toFixed(2);
      const result = {
        isValid: false,
        errorMessage: "",
        value,
      };
      if (!value) {
        result.errorMessage =
          "Please enter a valid value for the bonus amount.";
      } else if (value < 0) {
        result.value = "";
        result.errorMessage = "Value must be greater than 0.";
        ("The entered value was greater than the subtotal.");
      } else if (value > subtotal) {
        result.value = subtotal;
        result.errorMessage =
          "The entered value was greater than the subtotal.";
      } else if (value > availableBonus) {
        result.value = availableBonus;
        result.errorMessage = "You do not have this much bonus available.";
      } else {
        result.isValid = true;
      }
      return result;
    };

    this.setCartInterval = () => {
      const url = window.location.origin + "/cart.js";
      // check for cart update interval
      let isEqual = true;
      const cartInterval = setInterval(() => {
        this.getData(url).then((res) => {
          let cartItems = this.cartItems.data;
          // const productBonus = this.productBonus.data;
          // const bonusPercent = productBonus?.bonusPercent ? productBonus.bonusPercent : 15;
          // check fetched cart items with the ones in localStorage
          const { items } = res;
          const newCartItems = [];
          items.forEach((item, idx) => {
            newCartItems.push(item.id, item.quantity);
            if (
              item.quantity !== cartItems[idx * 2 + 1] ||
              item.id !== cartItems[idx * 2]
            ) {
              isEqual = false;
            }
          });
          if (items.length * 2 !== cartItems.length) {
            this.cartItems.data = newCartItems;
            isEqual = false;
            return;
          }
          // if cart has been changed
          if (!isEqual) {
            isEqual = true;
            // update cart data in localStorage
            this.cart.data = res;
            this.cartItems.data = newCartItems;
            // check if there is a bigger discount than
            // new cart subtotal
            if (this.discountCode?.data.discount_value) {
              if (
                this.discountCode.data.discount_value >
                this.cart.data.items_subtotal_price
              ) {
                this.changeBonusAmount();
              } else {
                this.authenticate("cart");
              }
            } else {
              this.authenticate("cart");
            }
          }
        });
      }, 2000);
    };

    /* --- Fetch API --- */
    this.formatMoney = (value) => {
      if (value) {
        let valueString = Number(value).toLocaleString("de-DE", {
          minimumFractionDigits: 2,
        });
        // if (!valueString.includes(',')) valueString += ',00';
        return valueString;
      }
      return "0,00";
    };

    this.formatRoundMoney = (value) => {
      return this.formatMoney(Number(value).toPrecision(2));
    };

    /* --- Fetch API --- */
    this.getData = async (url) => {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.json) {
        return response.json();
      } else {
        return JSON.parse(response);
      }
    };

    this.postData = async (url, data) => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const body = await response.json();
        return { status: 200, ...body };
      }
      return response;
    };

    this.deleteData = async (url) => {
      try {
        const response = await fetch(url, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.json) {
          return response.json();
        } else {
          // return JSON.parse(response);
          return response;
        }
      } catch (error) {
        console.log("Deleting error:", error);
      }
    };

    /////////
    // set initial values for localStorage vars
    const { shop } = options;
    this.APPLY_BONUS = "Apply Bonus";
    this.DELETE_BONUS = "Change/Remove applied bonus";
    this.HOST = host;
    this.token = this.setProp("loyalty-token");
    this.shop = this.setProp("loyalty-shop");
    this.member = this.setProp("loyalty-member");
    this.verified = this.setProp("loyalty-verified");
    this.availableBonus = this.setProp("loyalty-available-bonus");
    this.product = this.setProp("loyalty-product");
    this.productBonus = this.setProp("loyalty-product-bonus");
    this.cart = this.setProp("loyalty-cart");
    this.cartBonus = this.setProp("loyalty-cart-bonus");
    this.purchaseBonus = this.setProp("loyalty-purchase-bonus");
    this.cartItems = this.setProp("loyalty-cart-items"); // array of sets of item id and item quantity
    this.discountCode = this.setProp("loyalty-discount-code");
    if (shop) {
      this.shop.data = shop;
    }
  }
};
