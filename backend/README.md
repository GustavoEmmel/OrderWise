
# OrderWise Backend

OrderWise is a backend service designed to manage and process restaurant orders seamlessly. Built with simplicity and scalability in mind, this project relies on **TypeScript**, **Express**, and **TypeORM** as the foundation, with intelligent actions powered by **OpenAI**. Schema validation is implemented using **Zod** for reliability and consistency.

## Features

- **Dynamic Menu Management**: Supports multiple restaurants and menu items with detailed descriptions, prices, and preparation times.
- **Intelligent Order Processing**: Processes user requests for placing, modifying, and updating orders using AI-driven intent detection.
- **Order Finalization**: Ensures that orders are only finalized when they meet the necessary conditions.
- **Order Status Queries**: Allows users to ask about the status, progress, and estimated delivery time of their orders.
- **Refund Handling**: Processes refund requests with AI-powered input interpretation.
- **Update Orders**: Supports adding, removing, replacing items, and capturing notes in existing orders with detailed logging and validation.
- **Schema Validation**: Uses **Zod** to validate input schemas, ensuring data integrity across the application.

## Tech Stack

### Backend
- **Node.js**: A runtime environment for building scalable server-side applications.
- **Express**: A minimalist web framework for building APIs.
- **TypeScript**: Ensures type safety and improved developer experience.
- **TypeORM**: A robust ORM for managing database interactions.

### AI Integration
- **OpenAI API**: Powers intent detection and natural language understanding, allowing users to interact with the system intuitively.

### Database
- **PostgreSQL**: A relational database used for persistent data storage.

### Validation
- **Zod**: Ensures robust and strict validation of data structures for consistent and error-free inputs.

---

## Project Structure

```plaintext
src/
├── entities/        # Database models and menu data
├── middlewares/     # Middlewares for handling dependency injection
├── migrations/      # Migration code that needs to be filled in the database
├── routes/          # Express routes for handling API requests
├── services/        # Business logic (OrderService, chatAgent)
├── utils/           # Helper functions (e.g., Levenshtein for approximate matching)
└── index.ts         # Main entry point for the application
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** (>= 14.x)
- **npm** or **pnpm**
- **Docker** (latest version)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the OpenAI API key:
   - Create a `.env` file in the root directory.
   - Add your OpenAI API key:
     ```plaintext
     OPENAI_API_KEY=your-openai-api-key
     ```

3. Set up the database:
   - Ensure Docker is running.
   - Update the `.env` file with your database credentials.
   - When you start the server in development, a Docker container with PostgreSQL will be created, and migrations will run automatically.

4. Start the server:
   ```bash
   npm run dev
   ```

---

## Design Choices

1. **Simplicity and Type Safety**: The project leverages TypeScript to provide a strong type system, reducing runtime errors and improving maintainability.
2. **AI-Powered Decisions**: Instead of hardcoding logic for every scenario, this backend relies on OpenAI's natural language processing capabilities to dynamically interpret user intent.
3. **Schema Validation**: Zod ensures that all inputs are validated, reducing the likelihood of errors caused by malformed data.
4. **Scalable Architecture**: The combination of TypeORM and PostgreSQL allows the system to scale efficiently while maintaining data consistency.
5. **Real-Time Features**: WebSocket-based notifications for order updates.
6. **Future Optimizations**: Exploring **Levenshtein Distance** with fine-tuning to reduce the number of OpenAI calls while maintaining high accuracy.

---

## Examples of `chatAgent` Usage

The `chatAgent` is the core of OrderWise's AI-driven order processing. Below are examples of how to interact with it.

### Placing an Order

#### Input
```json
{
  "messages": [
    { "role": "user", "content": "I want 2 Big Macs and a Coke without ice." }
  ]
}
```

#### Behavior
- `Big Mac` will be added with a quantity of 2.
- `Coke` will be added with a note: `without ice`.

#### Output
```json
{
  "reply": "You have 2x Big Mac, 1x Coke (without ice). Would you like to finalize the order?"
}
```

---

### Modifying an Order

#### Adding Notes
#### Input
```json
{
  "messages": [
    { "role": "user", "content": "I want to add a note to my Big Mac: no pickles." }
  ]
}
```

#### Behavior
- The note `no pickles` will be added to the existing `Big Mac` in the order.

#### Output
```json
{
  "reply": "Your updated order contains: 2x Big Mac (no pickles), 1x Coke (without ice). Would you like to finalize the order?"
}
```

#### Removing an Item
#### Input
```json
{
  "messages": [
    { "role": "user", "content": "Remove the Coke from my order." }
  ]
}
```

#### Output
```json
{
  "reply": "Your updated order contains: 2x Big Mac (no pickles). Would you like to finalize the order?"
}
```

---

## Future Enhancements

- **Authentication**: Add user authentication and authorization.
- **Enhanced AI**: Leverage embeddings or fine-tuned OpenAI models for better context understanding and recommendations.
- **Integration tests**: Improve the tests to spin up a test database with Docker in order to actual hit the database and endpoints in validate the stored data.
- **Levenshtein Optimizations**: Refine and tune the Levenshtein distance algorithm to improve matching accuracy, reducing dependency on OpenAI for common tasks.
- **Admin Dashboard**: Create an admin panel for managing menu items, orders, and restaurants.

