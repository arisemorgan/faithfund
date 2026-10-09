import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Trash2, PlusCircle } from "lucide-react";

const ChurchChannelsTab = () => {
  const [channels, setChannels] = useState<any[]>([]);
  const [newChannel, setNewChannel] = useState({ name: "", youtube_url: "", description: "" });

  const fetchChannels = async () => {
    const res = await fetch("http://localhost:5000/api/church_channels");
    const data = await res.json();
    setChannels(data);
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const addChannel = async () => {
    await fetch("http://localhost:5000/api/church_channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newChannel),
    });
    setNewChannel({ name: "", youtube_url: "", description: "" });
    fetchChannels();
  };

  const updateChannel = async (id: number, youtube_url: string) => {
    await fetch(`http://localhost:5000/api/church_channels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtube_url }),
    });
    fetchChannels();
  };

  const deleteChannel = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this channel?")) return;
    await fetch(`http://localhost:5000/api/church_channels/${id}`, { method: "DELETE" });
    fetchChannels();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Church Channels</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add New Channel */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Channel Name"
            value={newChannel.name}
            onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
            className="border rounded px-2 py-1 flex-1"
          />
          <input
            type="text"
            placeholder="YouTube URL"
            value={newChannel.youtube_url}
            onChange={(e) => setNewChannel({ ...newChannel, youtube_url: e.target.value })}
            className="border rounded px-2 py-1 flex-1"
          />
          <Button onClick={addChannel}>
            <PlusCircle className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {/* Existing Channels */}
        {channels.map((ch) => (
          <div key={ch.id} className="border rounded p-4 mb-2 flex justify-between items-center">
            <div className="flex-1">
              <p className="font-semibold">{ch.name}</p>
              <input
                defaultValue={ch.youtube_url}
                className="border rounded px-2 py-1 w-full mt-1"
                onBlur={(e) => updateChannel(ch.id, e.target.value)}
              />
            </div>
            <Button size="sm" variant="destructive" onClick={() => deleteChannel(ch.id)}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ChurchChannelsTab;
