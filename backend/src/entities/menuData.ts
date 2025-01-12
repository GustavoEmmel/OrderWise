// Define the type for an individual menu item
export interface MenuItem {
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  timeToPrepare: number;
  tags?: string[];
}

// Define the type for a restaurant's menu
interface RestaurantMenu {
  name: string;
  items: MenuItem[];
}

// Define the type for the complete menu data
export interface MenuData {
  [key: string]: RestaurantMenu;
}

export const menuData: MenuData = {
  mcdonalds: {
    name: "McDonald's",
    items: [
      {
        name: "Big Mac",
        description: "A double beef burger with lettuce, cheese, and special sauce.",
        ingredients: ["beef patty", "lettuce", "cheese", "special sauce", "bun"],
        price: 5.99,
        timeToPrepare: 10,
        tags: ["burger", "beef", "classic"],
      },
      {
        name: "Large Fries",
        description: "Golden, crispy French fries with a touch of salt.",
        ingredients: ["potatoes", "salt", "oil"],
        price: 2.99,
        timeToPrepare: 5,
        tags: ["side", "vegetarian", "crispy"],
      },
      {
        name: "Chicken Nuggets (10 pcs)",
        description: "Crispy breaded chicken nuggets, perfect for dipping.",
        ingredients: ["chicken", "breadcrumbs", "spices"],
        price: 4.99,
        timeToPrepare: 8,
        tags: ["chicken", "snack", "crispy"],
      },
      {
        name: "Coke",
        description: "Refreshing Coca-Cola served chilled.",
        ingredients: ["carbonated water", "sugar", "flavoring"],
        price: 1.99,
        timeToPrepare: 2,
        tags: ["drink", "cold", "refreshing"],
      },
      {
        name: "Sprite",
        description:
          "Crisp, refreshing and clean-tasting Sprite is a lemon and lime-flavoured soft drink.",
        ingredients: ["carbonated water", "sugar", "flavoring"],
        price: 1.99,
        timeToPrepare: 2,
        tags: ["drink", "cold", "refreshing"],
      },
      {
        name: "Apple Pie",
        description: "A classic dessert filled with warm apple goodness.",
        ingredients: ["apples", "sugar", "pastry"],
        price: 1.5,
        timeToPrepare: 5,
        tags: ["dessert", "sweet", "classic"],
      },
    ],
  },
  pizzahut: {
    name: "Pizza Hut",
    items: [
      {
        name: "Pepperoni Pizza",
        description: "A classic pizza topped with pepperoni, cheese, and tomato sauce.",
        ingredients: ["pepperoni", "cheese", "dough", "tomato sauce"],
        price: 12.99,
        timeToPrepare: 20,
        tags: ["pizza", "pepperoni", "cheese"],
      },
      {
        name: "Cheese Lovers Pizza",
        description: "A pizza loaded with a blend of creamy cheeses.",
        ingredients: ["mozzarella", "parmesan", "cheddar", "dough", "tomato sauce"],
        price: 13.99,
        timeToPrepare: 18,
        tags: ["pizza", "cheese", "vegetarian"],
      },
      {
        name: "Garlic Bread",
        description: "Warm bread with a rich garlic butter spread.",
        ingredients: ["bread", "garlic", "butter"],
        price: 4.99,
        timeToPrepare: 10,
        tags: ["side", "vegetarian", "bread"],
      },
      {
        name: "Spicy Chicken Wings",
        description: "Crispy chicken wings coated in a tangy, spicy sauce.",
        ingredients: ["chicken wings", "hot sauce", "spices"],
        price: 9.99,
        timeToPrepare: 15,
        tags: ["chicken", "spicy", "snack"],
      },
    ],
  },
  kfc: {
    name: "KFC",
    items: [
      {
        name: "Original Recipe Chicken",
        description: "Juicy fried chicken with KFC's signature blend of herbs and spices.",
        ingredients: ["chicken", "flour", "spices", "oil"],
        price: 8.99,
        timeToPrepare: 12,
        tags: ["chicken", "fried", "classic"],
      },
      {
        name: "Mashed Potatoes with Gravy",
        description: "Creamy mashed potatoes topped with savory gravy.",
        ingredients: ["potatoes", "gravy", "butter"],
        price: 3.99,
        timeToPrepare: 5,
        tags: ["side", "vegetarian", "comfort food"],
      },
      {
        name: "Zinger Burger",
        description: "A spicy chicken sandwich with lettuce and mayo.",
        ingredients: ["chicken", "lettuce", "spicy seasoning", "bun"],
        price: 6.99,
        timeToPrepare: 10,
        tags: ["burger", "spicy", "chicken"],
      },
      {
        name: "Coleslaw",
        description: "A refreshing side of shredded cabbage and carrots in creamy dressing.",
        ingredients: ["cabbage", "carrots", "mayo"],
        price: 2.49,
        timeToPrepare: 3,
        tags: ["side", "vegetarian", "refreshing"],
      },
    ],
  },
  burgerking: {
    name: "Burger King",
    items: [
      {
        name: "Whopper",
        description: "A flame-grilled beef burger with fresh lettuce, tomatoes, and mayo.",
        ingredients: ["beef patty", "lettuce", "tomato", "mayo", "bun"],
        price: 6.99,
        timeToPrepare: 10,
        tags: ["burger", "beef", "classic"],
      },
      {
        name: "Onion Rings",
        description: "Crispy, golden-fried onion rings served with dipping sauce.",
        ingredients: ["onions", "batter", "oil"],
        price: 3.49,
        timeToPrepare: 7,
        tags: ["side", "vegetarian", "crispy"],
      },
      {
        name: "Chicken Fries",
        description: "Breaded and fried chicken strips shaped like fries.",
        ingredients: ["chicken", "breadcrumbs", "oil"],
        price: 5.49,
        timeToPrepare: 8,
        tags: ["chicken", "snack", "crispy"],
      },
      {
        name: "Chocolate Shake",
        description: "A rich and creamy chocolate milkshake.",
        ingredients: ["milk", "chocolate syrup", "ice cream"],
        price: 4.99,
        timeToPrepare: 5,
        tags: ["drink", "sweet", "dessert"],
      },
    ],
  },
  subway: {
    name: "Subway",
    items: [
      {
        name: "Italian B.M.T.",
        description: "A sandwich loaded with pepperoni, salami, and ham on fresh bread.",
        ingredients: ["pepperoni", "salami", "ham", "lettuce", "tomato", "bread"],
        price: 7.99,
        timeToPrepare: 8,
        tags: ["sandwich", "meat", "classic"],
      },
      {
        name: "Veggie Delite",
        description: "A fresh and healthy sub packed with veggies and your choice of dressing.",
        ingredients: ["lettuce", "tomato", "cucumber", "peppers", "bread"],
        price: 6.49,
        timeToPrepare: 5,
        tags: ["sandwich", "vegetarian", "healthy"],
      },
      {
        name: "Chicken Teriyaki",
        description: "Tender chicken in teriyaki sauce with fresh veggies.",
        ingredients: ["chicken", "teriyaki sauce", "lettuce", "tomato", "bread"],
        price: 8.49,
        timeToPrepare: 10,
        tags: ["sandwich", "chicken", "Asian"],
      },
      {
        name: "Chocolate Chip Cookie",
        description: "Soft and chewy cookie loaded with chocolate chips.",
        ingredients: ["flour", "chocolate chips", "butter", "sugar"],
        price: 1.25,
        timeToPrepare: 2,
        tags: ["dessert", "sweet", "snack"],
      },
    ],
  },
};
