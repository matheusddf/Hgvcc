import { Product, Category, StoreInfo, Neighborhood } from './types';

export const STORE_INFO: StoreInfo = {
  name: "Burger do Gordo",
  location: "Timon - MA",
  address: "Av. Jaime Rios, 170 - Parque Piauí, Timon - MA",
  instagram: "@burgerdogordo",
  status: "Fechado",
  openingHours: "Abrimos às 18h00",
  logo: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=200&q=80",
  banner: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80",
  whatsapp: "5586994240872",
  phone: "(86) 99424-0872"
};

export const HOURS = [
  { day: 'Segunda', hours: '18:00 às 23:00' },
  { day: 'Terça', hours: '18:00 às 23:00' },
  { day: 'Quarta', hours: '18:00 às 23:00' },
  { day: 'Quinta', hours: '18:00 às 23:00' },
  { day: 'Sexta', hours: '18:00 às 23:00' },
  { day: 'Sábado', hours: '18:00 às 23:00', active: true },
  { day: 'Domingo', hours: '18:00 às 22:30' },
];

export const PAYMENT_METHODS = [
  { id: 'dinheiro', name: 'Dinheiro', icon: 'Banknote' },
  { id: 'pix', name: 'Pix', icon: 'QrCode' },
  { id: 'credito', name: 'Cartão de crédito', icon: 'CreditCard' },
  { id: 'debito', name: 'Cartão de débito', icon: 'CreditCard' },
];

export const NEIGHBORHOODS: Neighborhood[] = [
  { name: "Centro", fee: 5.00 },
  { name: "Parque Piauí", fee: 7.00 },
  { name: "Cidade Nova", fee: 8.00 },
  { name: "São Francisco", fee: 7.00 },
  { name: "Outro / Não encontrei", fee: 0 }
];

export const CATEGORIES: Category[] = [
  { id: 'todos', name: 'Todos 📋', icon: 'LayoutGrid' },
  { id: 'destaques', name: 'Destaques 🔥', icon: 'Flame' },
  { id: 'hamburgueres', name: 'Burgers 🍔', icon: 'Beef' },
  { id: 'acompanhamentos', name: 'Acompanhamentos 🍟', icon: 'Utensils' },
  { id: 'bebidas', name: 'Bebidas 🥤', icon: 'CupSoda' },
  { id: 'sobremesas', name: 'Sobremesas 🍰', icon: 'Cake' },
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Gordelícia',
    description: 'Experimente nosso irresistível pão de batata, acompanhado por um blend suculento de 160g, queijo cheddar derretido, bacon crocante e nossa maionese especial.',
    price: 30.00,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80',
    category: 'hamburgueres',
    highlight: 'MAIS PEDIDO',
    upsellProductId: '4',
    options: [
      {
        title: 'Ponto da Carne',
        required: true,
        items: [
          { name: 'Mal passado', price: 0 },
          { name: 'Ao ponto', price: 0 },
          { name: 'Bem passado', price: 0 },
        ]
      },
      {
        title: 'Adicionais',
        items: [
          { name: 'Bacon extra', price: 4.00 },
          { name: 'Ovo frito', price: 2.50 },
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Burguinho',
    description: 'Pão artesanal, maionese, alface, tomate, cebola roxa, blend smash (80g) e queijo prato.',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=300&q=80',
    category: 'hamburgueres',
    upsellProductId: '5'
  },
  {
    id: '3',
    name: 'Burger do Gordo',
    description: 'Delicie-se com nosso pão artesanal recheado com maionese cremosa, salada fresca, dois blends de 120g e muito queijo.',
    price: 42.00,
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=300&q=80',
    category: 'hamburgueres',
    upsellProductId: '4'
  },
  {
    id: '4',
    name: 'Batata Rústica G',
    description: 'Batatas cortadas à mão, temperadas com páprica defumada e alecrim. Acompanha molho barbecue.',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=300&q=80',
    category: 'acompanhamentos'
  },
  {
    id: '5',
    name: 'Onion Rings',
    description: 'Anéis de cebola empanados e super crocantes. Acompanha maionese verde.',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1639122611434-f7463469a83e?auto=format&fit=crop&w=300&q=80',
    category: 'acompanhamentos'
  },
  {
    id: '6',
    name: 'Coca-Cola Lata',
    description: 'Original ou Zero. 350ml bem gelada.',
    price: 6.00,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80',
    category: 'bebidas'
  },
  {
    id: '7',
    name: 'Suco de Laranja Natural',
    description: 'Suco 100% natural, feito na hora. 400ml.',
    price: 12.00,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=300&q=80',
    category: 'bebidas'
  },
  {
    id: '8',
    name: 'Brownie com Sorvete',
    description: 'Brownie de chocolate meio amargo, servido quente com uma bola de sorvete de baunilha.',
    price: 22.00,
    image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=300&q=80',
    category: 'sobremesas'
  }
];
