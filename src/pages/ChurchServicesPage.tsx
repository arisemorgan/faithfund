import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Play, Users, Calendar } from 'lucide-react';
import { SEO } from '../components/SEO';

interface ChurchChannel {
  id: string;
  name: string;
  youtubeUrl: string;
  description: string;
  status: string;
  createdAt?: string;
}

export const ChurchServicesPage: React.FC = () => {
  const [channels, setChannels] = useState<ChurchChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<ChurchChannel | null>(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      // ✅ Corrected route name (underscore not dash)
      const res = await axios.get('http://localhost:5000/api/church_channels');

      // ✅ Map database field names (snake_case ➜ camelCase)
      const data = res.data.map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        youtubeUrl: ch.youtube_url,
        description: ch.description,
        status: ch.status,
        createdAt: ch.created_at
      }));

      setChannels(data);
      if (data.length > 0) {
        setSelectedChannel(data[0]);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ More robust YouTube embed parsing
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([^&]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : '';
    return `https://www.youtube.com/embed/${videoId}`;
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="Live Church Services - Watch Online"
        description="Join our live church services online. Experience worship, fellowship, and spiritual growth from anywhere in the world. Watch morning prayers, Sunday mass, youth fellowship, and Bible study."
        keywords="church services, live streaming, online church, worship, morning prayers, Sunday mass, youth fellowship, Bible study, virtual church"
        url="https://faithfund-connect-8ttwkvtv.sites.blink.new/church-services"
      />

      {/* ✅ Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <Badge className="mb-4">Live Streaming</Badge>
            <h1 className="text-4xl md:text-5xl font-bold">
              Join Our Church Services Live
            </h1>
            <p className="text-xl text-muted-foreground">
              Experience worship, fellowship, and spiritual growth from anywhere in the world
            </p>
          </div>
        </div>
      </section>

      {/* ✅ Main Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ✅ Main Video Player */}
          <div className="lg:col-span-2 space-y-6">
            {selectedChannel ? (
              <>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={getYouTubeEmbedUrl(selectedChannel.youtubeUrl)}
                    title={selectedChannel.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-2xl">{selectedChannel.name}</CardTitle>
                        <CardDescription>{selectedChannel.description}</CardDescription>
                      </div>
                      {selectedChannel.status === 'active' && (
                        <Badge variant="destructive" className="animate-pulse">
                          <span className="mr-2">●</span> LIVE
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>1,234 watching</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Started 30 min ago</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">About this service</h4>
                      <p className="text-sm text-muted-foreground">
                        Join us for an inspiring time of worship, teaching, and fellowship. 
                        Experience the presence of God as we gather together in faith and unity.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="aspect-video flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Play className="h-16 w-16 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">No active services at the moment</p>
                </div>
              </Card>
            )}
          </div>

          {/* ✅ Sidebar - Channel List */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Available Services</h3>
            
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : channels.length > 0 ? (
              <div className="space-y-4">
                {channels.map((channel) => (
                  <Card
                    key={channel.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedChannel?.id === channel.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedChannel(channel)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{channel.name}</CardTitle>
                        {selectedChannel?.id === channel.id && (
                          <Badge variant="outline" className="ml-2">Now Playing</Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs line-clamp-2">
                        {channel.description || 'Join us for worship and fellowship'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <Button
                        size="sm"
                        variant={selectedChannel?.id === channel.id ? 'default' : 'outline'}
                        className="w-full"
                      >
                        <Play className="h-3 w-3 mr-2" />
                        Watch Live
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Play className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No services available at the moment
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
