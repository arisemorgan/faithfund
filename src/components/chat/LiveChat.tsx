import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { db } from "../firebase";  // firebase config
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

export default function LiveChat({ close, userId }: { close: () => void, userId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const q = query(collection(db, "chats", userId, "messages"), orderBy("timestamp"));
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => doc.data()));
    });
    return () => unsub();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    await addDoc(collection(db, "chats", userId, "messages"), {
      text: input,
      sender: "user",
      timestamp: Date.now()
    });
    setInput("");
  };

  return (
    <div className="fixed bottom-24 right-6 w-80 h-96 bg-white shadow-xl rounded-xl p-4 flex flex-col border">
      <div className="flex justify-between items-center pb-2 border-b">
        <h2 className="font-semibold">Live Support</h2>
        <button onClick={close}><X /></button>
      </div>

      <div className="flex-1 overflow-y-auto my-2 space-y-1">
        {messages.map((m, i) => (
          <div key={i} className={`p-2 rounded-md text-sm w-fit ${
            m.sender === "user" ? "bg-primary text-white ml-auto" :
            "bg-gray-200 text-black"
          }`}>
            {m.text}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          className="border rounded p-2 flex-1"
          placeholder="Type message..."
        />
        <button onClick={sendMessage} className="bg-primary text-white p-2 rounded">Send</button>
      </div>
    </div>
  );
}
