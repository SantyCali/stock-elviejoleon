export const DAYS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

export const MOCK_PROVIDERS = [
  {
    id: '1',
    name: 'Sancor',
    day: 'lunes',
    products: [
      { id: '1-1', name: 'Leche entera 1L', stock: 8, suggested: 12 },
      { id: '1-2', name: 'Yogur vainilla', stock: 4, suggested: 10 },
      { id: '1-3', name: 'Queso cremoso', stock: 2, suggested: 6 },
    ],
  },
  {
    id: '2',
    name: 'Coca Cola',
    day: 'miércoles',
    products: [
      { id: '2-1', name: 'Coca 2.25L', stock: 10, suggested: 15 },
      { id: '2-2', name: 'Sprite 2.25L', stock: 5, suggested: 8 },
      { id: '2-3', name: 'Fanta 2.25L', stock: 3, suggested: 7 },
    ],
  },
  {
    id: '3',
    name: 'Serenísima',
    day: 'viernes',
    products: [
      { id: '3-1', name: 'Leche descremada', stock: 7, suggested: 10 },
      { id: '3-2', name: 'Crema', stock: 3, suggested: 5 },
      { id: '3-3', name: 'Manteca', stock: 6, suggested: 6 },
    ],
  },
];