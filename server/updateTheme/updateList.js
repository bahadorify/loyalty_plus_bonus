/**
 * key: path to the file to be change on Shopify
 * filePath: path to file in this repo containing changes
 * toReplace: unique text within the original file to be replaced
 * setAfter (optional): if set to true, the snippet will be
 *    placed after the "toReplace" text
 */
const updateList = [
  {
    key: "layout/theme.liquid",
    filePath: "../../liquid/layout/theme.liquid",
    toReplace: ["</body>"],
  },
  {
    key: "sections/cart-template.liquid",
    filePath: "../../liquid/sections/cart-template.liquid",
    toReplace: ['<div class="PageContent">'],
  },
  {
    key: "sections/product-template.liquid",
    filePath: "../../liquid/sections/product-template.liquid",
    toReplace: [
      "{% if section.settings.show_share_buttons %}",
      "{%- if section.settings.show_share_buttons -%}",
    ],
  },
  {
    key: "snippets/cart-drawer.liquid",
    filePath: "../../liquid/snippets/cart-drawer.liquid",
    toReplace: ["{% render 'cart-items' %}"],
    setAfter: true,
  },
];

// do not add loyalty-vars.liquid (it is added in updateTheme.js)
const newUploadsList = [
  {
    key: "assets/loyalty-utils.js",
    filePath: "../../liquid/assets/loyalty-utils.js",
  },
  {
    key: "snippets/loyalty-cart-drawer.liquid",
    filePath: "../../liquid/snippets/loyalty-cart-drawer.liquid",
  },
  {
    key: "snippets/loyalty-cart.liquid",
    filePath: "../../liquid/snippets/loyalty-cart.liquid",
  },
  {
    key: "snippets/loyalty-product.liquid",
    filePath: "../../liquid/snippets/loyalty-product.liquid",
  },
];

export { updateList, newUploadsList };
