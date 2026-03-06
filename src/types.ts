export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_surname: string;
  phone: string;
  address: string;
  items: CartItem[];
  total_price: number;
  status: 'pending' | 'confirmed' | 'delivered';
  is_archived: number; // 0 or 1
  created_at: string;
}

export interface Settings {
  hero_title: string;
  hero_subtitle: string;
  shop_name: string;
  contact_phone: string;
  contact_address: string;
  categories: string[];
}
