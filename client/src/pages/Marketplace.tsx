import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<"rating" | "newest" | "popular">("rating");

  // Fetch marketplace listings with search
  const { data: listings, isLoading } = trpc.marketplace.listTemplates.useQuery({
    category: selectedCategory,
    sortBy,
    limit: 50,
    ...(searchTerm && { search: searchTerm }),
  });

  // Purchase mutation
  const { mutate: purchaseTemplate, isPending } = trpc.marketplace.purchaseTemplate.useMutation();

  const handlePurchase = (templateId: number) => {
    purchaseTemplate(
      { templateId },
      {
        onSuccess: () => {
          alert("Template purchased successfully!");
        },
        onError: (error) => {
          alert(`Purchase failed: ${error.message}`);
        },
      }
    );
  };

  const categories = ["saas", "dashboard", "ecommerce", "social", "blog", "tool"];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Template Marketplace</h1>
        <p className="text-muted-foreground mb-8">Discover and purchase pre-built project templates</p>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={selectedCategory === undefined ? "default" : "outline"}
              onClick={() => setSelectedCategory(undefined)}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className="capitalize"
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant={sortBy === "rating" ? "default" : "outline"}
              onClick={() => setSortBy("rating")}
            >
              Top Rated
            </Button>
            <Button
              variant={sortBy === "popular" ? "default" : "outline"}
              onClick={() => setSortBy("popular")}
            >
              Most Popular
            </Button>
            <Button
              variant={sortBy === "newest" ? "default" : "outline"}
              onClick={() => setSortBy("newest")}
            >
              Newest
            </Button>
          </div>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="text-center py-12">Loading templates...</div>
        ) : listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((template: any) => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{template.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{template.category}</span>
                    <span className="text-sm text-muted-foreground">{template.downloads} downloads</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < Math.round(template.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">({template.reviews} reviews)</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      {template.price > 0 ? (
                        <>
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="text-2xl font-bold">${template.price}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">Free</p>
                          <p className="text-2xl font-bold text-green-600">$0</p>
                        </>
                      )}
                    </div>
                    <Button
                      onClick={() => handlePurchase(template.id)}
                      disabled={isPending}
                      className="w-32"
                    >
                      {template.price > 0 ? "Purchase" : "Use Free"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No templates found. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
