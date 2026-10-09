import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Heart } from 'lucide-react';

interface Campaign {
  id: string | number; // ✅ allow both string or number
  title: string;
  slug?: string;
  description: string;
  category: string;
  goalAmount: number;
  raisedAmount: number;
  imageUrl?: string;
  creatorName?: string;
  status?: string;
}

interface CampaignCardProps {
  campaign: Campaign;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => {
  const {
    id,
    slug,
    title,
    description,
    category,
    goalAmount,
    raisedAmount,
    imageUrl,
    creatorName = 'Campaign Creator',
  } = campaign;

  // ✅ Use slug if available, else fall back to ID
  const campaignPath = `/campaign/${slug || id}`;

  const percentage = Math.min((raisedAmount / goalAmount) * 100, 100);
  const remaining = goalAmount - raisedAmount;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <Link to={campaignPath}>
        <div className="aspect-video relative overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Heart className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          <Badge className="absolute top-3 right-3">{category}</Badge>
        </div>
      </Link>

      <CardHeader>
        <Link to={campaignPath}>
          <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
          {description}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-primary">
              ₦{raisedAmount.toLocaleString()}
            </span>
            <span className="text-muted-foreground">
              of ₦{goalAmount.toLocaleString()}
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentage.toFixed(0)}% funded</span>
            <span>₦{remaining.toLocaleString()} to go</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          by <span className="font-medium text-foreground">{creatorName}</span>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full" size="sm">
          <Link to={campaignPath}>Donate Now</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
