
# OrderWise

OrderWise is a full-stack application designed to simplify restaurant order management using AI-powered interactions and real-time updates. The project consists of a **TypeScript/Express** backend and a **Next.js** frontend, with **Ably** used for WebSocket-based real-time updates.

---

## Features

### Backend
- **AI-Driven Order Management**: Handles complex user interactions for placing, modifying, and querying orders using OpenAI's GPT-4.
- **Dynamic Menu Support**: Supports multiple restaurants with detailed menu data, including pricing, preparation time, and item tags.
- **Order Processing**: Enables actions such as adding notes, replacing items, and querying order status.
- **WebSocket Notifications**: Sends real-time updates for order changes and status updates using **Ably**.
- **Schema Validation**: Ensures data consistency with **Zod** validation.

### Frontend
- **Interactive Chat Interface**: A clean and responsive chat interface powered by **Next.js**, enabling users to interact with the AI backend.
- **Order Dashboard**: Displays a list of current and past orders with detailed views and action buttons for managing orders.
- **Real-Time Updates**: Displays live updates for order status and changes using **Ably** WebSockets.

---

## Tech Stack

### Backend
- **Node.js**: JavaScript runtime for scalable backend applications.
- **Express**: Minimalist web framework for APIs.
- **TypeScript**: Enhances type safety and developer productivity.
- **TypeORM**: Manages database interactions with PostgreSQL.
- **OpenAI API**: Powers natural language understanding for user interactions.
- **Ably**: Enables real-time WebSocket updates.
- **Zod**: Provides robust schema validation for all inputs and outputs.

### Frontend
- **Next.js**: React-based framework for server-side rendering and seamless API integrations.
- **TypeScript**: Ensures type safety and consistency in the frontend code.
- **Ably**: Real-time messaging service for WebSocket communication with the backend.
- **Tailwind CSS**: Simplifies UI design with utility-first CSS.

---

## Getting Started

### Prerequisites
- **Node.js** (>= 14.x)
- **npm** or **pnpm**
- **Docker** (optional for local database setup)

### Installation

#### Backend
1. Clone the repository and navigate to the `backend` folder:
   ```bash
   git clone <repository-url>
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the `backend` folder:
     ```plaintext
     OPENAI_API_KEY=your-openai-api-key
     DB_HOST=localhost
     DB_PORT=5432
     DB_USER=admin
     DB_PASSWORD=password
     DB_NAME=orderwise
     DB_SSL=true
     ABLY_API_KEY=your-ably-api-key
     ```
4. Run the backend:
   ```bash
   npm run dev
   ```

#### Frontend
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env.local` in the `frontend` folder:
   ```plaintext
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
   NEXT_PUBLIC_ABLY_API_KEY=your-ably-api-key
   ```
4. Run the frontend:
   ```bash
   npm run dev
   ```

---

## Sample Prompts for Chat

Here are examples of how users can interact with the **OrderWise** chatbot:

### Placing Orders
- **Prompt**: "I want 2 Big Macs and a Coke without ice."
  - **Response**: "You have 2x Big Mac, 1x Coke (without ice). Would you like to finalize the order?"

### Modifying Orders
- **Prompt**: "Remove the Coke from my order."
  - **Response**: "Your updated order contains: 2x Big Mac. Would you like to finalize the order?"

- **Prompt**: "Add a note to my Big Mac: no pickles."
  - **Response**: "Your updated order contains: 2x Big Mac (no pickles). Would you like to finalize the order?"

### Querying Order Status
- **Prompt**: "What's the status of my order?"
  - **Response**: "Your order is in progress. It is expected to arrive in approximately 15 minutes."

### Refund Requests
- **Prompt**: "I want a refund for my last order."
  - **Response**: "Your refund has been processed. Refunded amount: $20."

---

## Next Steps

1. **Authentication and Authorization**: Implement user accounts and role-based access control.
2. **Enhanced AI Model Support**:
   - Transition to a model-agnostic design to support models beyond GPT-4.
   - Implement retries and error handling using the [AI SDK from Vercel](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling).
3. **UI Enhancements**:
   - Add admin dashboards for managing restaurants, menus, and orders.
   - Improve responsiveness and accessibility.
4. **Integration Tests**:
   - Set up automated tests with a test database and endpoint validations.
5. **Performance Optimization**:
   - Explore caching strategies to reduce database load and improve response times.


