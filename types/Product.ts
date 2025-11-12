
export interface Product {
  id: string;
  name: string;
  farm: string;
  location: string;
  price: number;
  originalPrice?: number;
  unit: string;
  rating: number;
  image: string;
  category: string;
  inStock: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  emoji: string;
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  address: string;
  rating: number;
  hours: string;
  image: string;
}
