import Chat from "@/components/Chat";
import Orders from "@/components/Orders";

export default function Home() {
  return (
    <main className="flex h-full w-full">
      {/* Orders section - 70% width */}
      <section className="w-2/3 border-r border-gray-800 overflow-y-auto">
        <Orders />
      </section>

      {/* Chat section - 30% width */}
      <section className="w-1/3 bg-green-900">
        <Chat />
      </section>
    </main>
  );
}
