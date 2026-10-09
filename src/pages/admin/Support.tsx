import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function SupportAdmin() {
  const [users, setUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string|null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "chats"), snap => {
      setUsers(snap.docs.map(d=>d.id));
    });
    return () => unsub();
  }, []);

  useEffect(()=>{
    if (!selectedUser) return;
    const unsub = onSnapshot(collection(db,"chats",selectedUser,"messages"),snap=>{
      setMessages(snap.docs.map(d=>d.data()));
    });
    return ()=>unsub();
  },[selectedUser])

  const send = async ()=>{
    await addDoc(collection(db,"chats",selectedUser,"messages"),{
      text: reply,
      sender:"admin",
      timestamp:Date.now()
    })
    setReply("");
  }

  return (
    <div className="flex p-6 gap-6">
      <div className="w-1/4 border-r">
        <h2 className="font-bold text-lg mb-4">Chats</h2>
        {users.map(u=>(
          <p key={u} className="cursor-pointer p-2 hover:bg-gray-200" onClick={()=>setSelectedUser(u)}>
            {u}
          </p>
        ))}
      </div>

      {selectedUser && (
        <div className="flex-1 flex flex-col">
          <h2 className="font-bold mb-2">Chat with: {selectedUser}</h2>

          <div className="flex-1 overflow-y-auto space-y-2 p-2">
            {messages.map((m,i)=>(
              <div key={i} className={`p-2 rounded-md w-fit ${
                m.sender==="admin" ? "bg-primary text-white" : "bg-gray-300"
              }`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            <input 
              value={reply}
              onChange={e=>setReply(e.target.value)}
              className="border p-2 flex-1 rounded"
              placeholder="Reply message..."
            />
            <button className="bg-primary text-white rounded p-2" onClick={send}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
