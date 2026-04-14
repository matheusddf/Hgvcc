export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  highlight?: string;
  upsellProductId?: string;
  options?: {
    title: string;
    required?: boolean;
    items: { name: string; price: number }[];
  }[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface CartItem extends Product {
  quantity: number;
  observations?: string;
  selectedOptions?: Record<string, string[]>;
}

export interface StoreInfo {
  name: string;
  location: string;
  address: string;
  instagram: string;
  status: string;
  openingHours: string;
  logo: string;
  banner: string;
  whatsapp: string;
  phone: string;
}

export interface Neighborhood {
  name: string;
  fee: number;
}
