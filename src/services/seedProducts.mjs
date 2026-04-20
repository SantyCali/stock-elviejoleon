import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCTu0d-iuKL-21Hk9n0_Giq9KKcB5zS1Rk',
  authDomain: 'stock-el-viejo-leon.firebaseapp.com',
  projectId: 'stock-el-viejo-leon',
  storageBucket: 'stock-el-viejo-leon.firebasestorage.app',
  messagingSenderId: '991613535410',
  appId: '1:991613535410:web:500707837c00b0374735ab',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const products = [
  // =========================
  // SANCOR
  // =========================
  { id: 'sancor-papas', name: 'Papas', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-palitos', name: 'Palitos', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-chizitos', name: 'Chizitos', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-aritos-cebolla', name: 'Aritos cebolla', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-puflitos', name: 'Puflitos', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-tutucas', name: 'Tutucas', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-cascarones', name: 'Cascarones', providerId: 'sancor', category: 'Snack', active: true },
  { id: 'sancor-mani', name: 'Maní', providerId: 'sancor', category: 'Snack', active: true },

  { id: 'sancor-picadillo', name: 'Picadillo', providerId: 'sancor', category: 'Otros', active: true },
  { id: 'sancor-pate', name: 'Paté', providerId: 'sancor', category: 'Otros', active: true },
  { id: 'sancor-queso-regianito', name: 'Queso regianito', providerId: 'sancor', category: 'Otros', active: true },

  { id: 'sancor-hellmans-125-may', name: 'Hellmans x125 may.', providerId: 'sancor', category: 'Aderezos', active: true },
  { id: 'sancor-hellmans-250-may', name: 'Hellmans x250 may.', providerId: 'sancor', category: 'Aderezos', active: true },
  { id: 'sancor-ketchup-60-hellmans', name: 'Ketchup x60 Hellmans', providerId: 'sancor', category: 'Aderezos', active: true },
  { id: 'sancor-ketchup-250-hellmans', name: 'Ketchup x250 Hellmans', providerId: 'sancor', category: 'Aderezos', active: true },
  { id: 'sancor-savora-60', name: 'Savora x60', providerId: 'sancor', category: 'Aderezos', active: true },
  { id: 'sancor-savora-250', name: 'Savora x250', providerId: 'sancor', category: 'Aderezos', active: true },

  { id: 'sancor-dulce-de-leche-250', name: 'Dulce de leche x250', providerId: 'sancor', category: 'Dulce de leche', active: true },
  { id: 'sancor-dulce-de-leche-400', name: 'Dulce de leche x400', providerId: 'sancor', category: 'Dulce de leche', active: true },

  { id: 'sancor-yogur-litro-frutilla', name: 'Yogurth x litro frutilla', providerId: 'sancor', category: 'Yogurth x litro', active: true },
  { id: 'sancor-yogur-litro-vainilla', name: 'Yogurth x litro vainilla', providerId: 'sancor', category: 'Yogurth x litro', active: true },
  { id: 'sancor-yogur-litro-durazno', name: 'Yogurth x litro durazno', providerId: 'sancor', category: 'Yogurth x litro', active: true },
  { id: 'sancor-yogur-litro-firmes', name: 'Yogurth x litro firmes', providerId: 'sancor', category: 'Yogurth x litro', active: true },
  { id: 'sancor-yogur-litro-cremoso', name: 'Yogurth x litro cremoso', providerId: 'sancor', category: 'Yogurth x litro', active: true },
  { id: 'sancor-sancorito', name: 'Sancorito', providerId: 'sancor', category: 'Yogurth x litro', active: true },
  { id: 'sancor-con-cereal', name: 'Con cereal', providerId: 'sancor', category: 'Yogurth x litro', active: true },

  { id: 'sancor-salchicha-la-casona', name: 'Salchicha La Casona', providerId: 'sancor', category: 'Fiambres y varios', active: true },
  { id: 'sancor-milan-la-casona', name: 'Milan La Casona', providerId: 'sancor', category: 'Fiambres y varios', active: true },
  { id: 'sancor-jamon-la-casona', name: 'Jamón La Casona', providerId: 'sancor', category: 'Fiambres y varios', active: true },
  { id: 'sancor-pategras-sancor', name: 'Pategras Sancor', providerId: 'sancor', category: 'Fiambres y varios', active: true },
  { id: 'sancor-manteca-100', name: 'Manteca x100 Sancor', providerId: 'sancor', category: 'Fiambres y varios', active: true },

  // =========================
  // QUILMES
  // =========================
  { id: 'quilmes-1-litro', name: 'Quilmes 1 litro', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-brahama', name: 'Brahama', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-stella-rubia', name: 'Stella rubia', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-stella-negra', name: 'Stella negra', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-andes-tradicional', name: 'Andes tradicional', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-corona-grande', name: 'Corona grande', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-corona-chica', name: 'Corona chica', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-andes-origen', name: 'Andes origen', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-rubia', name: 'Rubia', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-roja', name: 'Roja', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-negra', name: 'Negra', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-patagonia', name: 'Patagonia', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-ipavera', name: 'Ipavera', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-kune', name: 'Kune', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-amber', name: 'Amber', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-bohemian', name: 'Bohemian', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-hopy-lager', name: 'Hopy Lager', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-ipa-24-7', name: 'IPA 24/7', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-patagonia-litro-amber', name: 'Patagonia de litro amber', providerId: 'quilmes', category: 'Botellas', active: true },
  { id: 'quilmes-stout', name: 'Quilmes stout', providerId: 'quilmes', category: 'Botellas', active: true },

  { id: 'quilmes-pepsi-225', name: 'Pepsi x2.25L', providerId: 'quilmes', category: 'Gaseosas', active: true },
  { id: 'quilmes-seven-up-225', name: 'Seven Up x2.250L', providerId: 'quilmes', category: 'Gaseosas', active: true },
  { id: 'quilmes-paso-de-los-toros-15', name: 'Paso de los Toros x1.5L', providerId: 'quilmes', category: 'Gaseosas', active: true },
  { id: 'quilmes-tonica', name: 'Tónica', providerId: 'quilmes', category: 'Gaseosas', active: true },
  { id: 'quilmes-pomelo', name: 'Pomelo', providerId: 'quilmes', category: 'Gaseosas', active: true },

  { id: 'quilmes-lata-brahama', name: 'Brahama 473cc', providerId: 'quilmes', category: 'Latas 473cc', active: true },
  { id: 'quilmes-lata-quilmes-rubia', name: 'Quilmes rubia 473cc', providerId: 'quilmes', category: 'Latas 473cc', active: true },
  { id: 'quilmes-lata-quilmes-stoud', name: 'Quilmes stoud 473cc', providerId: 'quilmes', category: 'Latas 473cc', active: true },
  { id: 'quilmes-lata-quilmes-ipa', name: 'Quilmes IPA 473cc', providerId: 'quilmes', category: 'Latas 473cc', active: true },
  { id: 'quilmes-lata-stella', name: 'Stella 473cc', providerId: 'quilmes', category: 'Latas 473cc', active: true },
  { id: 'quilmes-lata-andes', name: 'Andes 473cc', providerId: 'quilmes', category: 'Latas 473cc', active: true },
  { id: 'quilmes-lata-andes-ipa', name: 'Andes IPA 473cc', providerId: 'quilmes', category: 'Latas 473cc', active: true },
  { id: 'quilmes-lata-andes-roja', name: 'Andes roja 473cc', providerId: 'quilmes', category: 'Latas 473cc', active: true },
  { id: 'quilmes-lata-andes-rubia', name: 'Andes rubia 473cc', providerId: 'quilmes', category: 'Latas 473cc', active: true },
  { id: 'quilmes-lata-andes-negra', name: 'Andes negra 473cc', providerId: 'quilmes', category: 'Latas 473cc', active: true },
  { id: 'quilmes-rockstar', name: 'Rockstar', providerId: 'quilmes', category: 'Latas 473cc', active: true },

  { id: 'quilmes-gatorade-grande-azul', name: 'Gatorade grande azul', providerId: 'quilmes', category: 'Gatorade grande', active: true },
  { id: 'quilmes-gatorade-grande-rojo', name: 'Gatorade grande rojo', providerId: 'quilmes', category: 'Gatorade grande', active: true },
  { id: 'quilmes-gatorade-grande-manzana', name: 'Gatorade grande manzana', providerId: 'quilmes', category: 'Gatorade grande', active: true },

  { id: 'quilmes-gatorade-chico-azul', name: 'Gatorade chico azul', providerId: 'quilmes', category: 'Gatorade chico', active: true },
  { id: 'quilmes-gatorade-chico-rojo', name: 'Gatorade chico rojo', providerId: 'quilmes', category: 'Gatorade chico', active: true },
  { id: 'quilmes-gatorade-chico-manzana', name: 'Gatorade chico manzana', providerId: 'quilmes', category: 'Gatorade chico', active: true },

  // =========================
  // GOLYMEN
  // =========================
  { id: 'golymen-higienico-elegante', name: 'Higiénico Elegante', providerId: 'golymen', category: 'Papel', active: true },
  { id: 'golymen-rollo-cocina-elegante', name: 'Rollo de cocina Elegante', providerId: 'golymen', category: 'Papel', active: true },
  { id: 'golymen-vainillas-7u', name: 'Vainillas x7u', providerId: 'golymen', category: 'Galletitas y dulces', active: true },
  { id: 'golymen-vainillas-14u', name: 'Vainillas x14u', providerId: 'golymen', category: 'Galletitas y dulces', active: true },
  { id: 'golymen-fauna-grande', name: 'Fauna grande', providerId: 'golymen', category: 'Galletitas y dulces', active: true },
  { id: 'golymen-fauna-chica', name: 'Fauna chica', providerId: 'golymen', category: 'Galletitas y dulces', active: true },
  { id: 'golymen-satur-salado', name: 'Satur salado', providerId: 'golymen', category: 'Galletitas y dulces', active: true },
  { id: 'golymen-satur-agridulce', name: 'Satur agridulce', providerId: 'golymen', category: 'Galletitas y dulces', active: true },
  { id: 'golymen-satur-negro', name: 'Satur negro', providerId: 'golymen', category: 'Galletitas y dulces', active: true },
  { id: 'golymen-trio-tri-choc', name: 'Tri choc', providerId: 'golymen', category: 'Trío', active: true },
  { id: 'golymen-trio-trichip', name: 'Trichip', providerId: 'golymen', category: 'Trío', active: true },
  { id: 'golymen-trio-chocotrio', name: 'Chocotrio', providerId: 'golymen', category: 'Trío', active: true },
  { id: 'golymen-trio-pepas', name: 'Pepas trío', providerId: 'golymen', category: 'Trío', active: true },

  { id: 'golymen-frolitas-membrillo', name: 'Frolitas membrillo', providerId: 'golymen', category: 'Otros', active: true },
  { id: 'golymen-frolitas-batata', name: 'Frolitas batata', providerId: 'golymen', category: 'Otros', active: true },
  { id: 'golymen-peponas', name: 'Peponas', providerId: 'golymen', category: 'Otros', active: true },
  { id: 'golymen-pepas-chip', name: 'Pepas c/chip', providerId: 'golymen', category: 'Otros', active: true },
  { id: 'golymen-yerba-amanda-250', name: 'Yerba Amanda x250', providerId: 'golymen', category: 'Yerbas', active: true },
  { id: 'golymen-yerba-amanda-500', name: 'Yerba Amanda x500', providerId: 'golymen', category: 'Yerbas', active: true },
  { id: 'golymen-rosamonte-250', name: 'Rosamonte x250', providerId: 'golymen', category: 'Yerbas', active: true },
  { id: 'golymen-rosamonte-500', name: 'Rosamonte x500', providerId: 'golymen', category: 'Yerbas', active: true },
  { id: 'golymen-rosamonte-suave-250', name: 'Rosamonte suave x250', providerId: 'golymen', category: 'Yerbas', active: true },
  { id: 'golymen-rosamonte-suave-500', name: 'Rosamonte suave x500', providerId: 'golymen', category: 'Yerbas', active: true },
  { id: 'golymen-madalenas-pozo', name: 'Madalenas Pozo', providerId: 'golymen', category: 'Otros', active: true },
  { id: 'golymen-hojalmar', name: 'Hojalmar', providerId: 'golymen', category: 'Otros', active: true },
  { id: 'golymen-oblitas-chicas', name: 'Oblitas chicas', providerId: 'golymen', category: 'Otros', active: true },

  { id: 'golymen-vinagre-redil-500', name: 'Vinagre Redil x500cc', providerId: 'golymen', category: 'Vinagres', active: true },
  { id: 'golymen-vinagre-alcohol', name: 'Vinagre de alcohol', providerId: 'golymen', category: 'Vinagres', active: true },
  { id: 'golymen-vinagre-manzana', name: 'Vinagre de manzana', providerId: 'golymen', category: 'Vinagres', active: true },
  { id: 'golymen-vinagre-vino', name: 'Vinagre de vino', providerId: 'golymen', category: 'Vinagres', active: true },
  { id: 'golymen-vinagre-alcohol-litro', name: 'Vinagre de alcohol x litro', providerId: 'golymen', category: 'Vinagres', active: true },
  { id: 'golymen-vinagre-manzana-litro', name: 'Vinagre de manzana x litro', providerId: 'golymen', category: 'Vinagres', active: true },
  { id: 'golymen-vinagre-vino-litro', name: 'Vinagre de vino x litro', providerId: 'golymen', category: 'Vinagres', active: true },

  { id: 'golymen-alcohol', name: 'Alcohol', providerId: 'golymen', category: 'Limpieza e higiene', active: true },
  { id: 'golymen-toallitas-mujer', name: 'Toallitas mujer', providerId: 'golymen', category: 'Limpieza e higiene', active: true },
  { id: 'golymen-detergentes', name: 'Detergentes', providerId: 'golymen', category: 'Limpieza e higiene', active: true },
  { id: 'golymen-plusbelle-shampoo', name: 'Plusbelle shampoo', providerId: 'golymen', category: 'Limpieza e higiene', active: true },
  { id: 'golymen-plusbelle-acondicionador', name: 'Plusbelle acondicionador', providerId: 'golymen', category: 'Limpieza e higiene', active: true },
  { id: 'golymen-plusbelle-jabon-tocador', name: 'Plusbelle jabón de tocador', providerId: 'golymen', category: 'Limpieza e higiene', active: true },
  { id: 'golymen-jabon-polvo-400', name: 'Jabón en polvo x400', providerId: 'golymen', category: 'Limpieza e higiene', active: true },
  { id: 'golymen-lavado-mano', name: 'Lavado a mano', providerId: 'golymen', category: 'Limpieza e higiene', active: true },
  { id: 'golymen-lavado-maquina', name: 'Lavado a máquina', providerId: 'golymen', category: 'Limpieza e higiene', active: true },
  { id: 'golymen-alcohol-250', name: 'Alcohol x250', providerId: 'golymen', category: 'Limpieza e higiene', active: true },

  // =========================
  // SECCO (BAGGIO)
  // =========================
  { id: 'secco-jugo-litro-naranja', name: 'Jugo Baggio de litro naranja', providerId: 'secco', category: 'Jugo Baggio de litro', active: true },
  { id: 'secco-jugo-litro-multifruta', name: 'Jugo Baggio de litro multifruta', providerId: 'secco', category: 'Jugo Baggio de litro', active: true },
  { id: 'secco-jugo-litro-durazno', name: 'Jugo Baggio de litro durazno', providerId: 'secco', category: 'Jugo Baggio de litro', active: true },
  { id: 'secco-jugo-litro-manzana', name: 'Jugo Baggio de litro manzana', providerId: 'secco', category: 'Jugo Baggio de litro', active: true },

  { id: 'secco-jugo-200-naranja', name: 'Jugo Baggio de 200cc naranja', providerId: 'secco', category: 'Jugo Baggio de 200cc', active: true },
  { id: 'secco-jugo-200-multifruta', name: 'Jugo Baggio de 200cc multifruta', providerId: 'secco', category: 'Jugo Baggio de 200cc', active: true },
  { id: 'secco-jugo-200-durazno', name: 'Jugo Baggio de 200cc durazno', providerId: 'secco', category: 'Jugo Baggio de 200cc', active: true },
  { id: 'secco-jugo-200-manzana', name: 'Jugo Baggio de 200cc manzana', providerId: 'secco', category: 'Jugo Baggio de 200cc', active: true },

  { id: 'secco-chocolatada-litro', name: 'Chocolatada Baggio de litro', providerId: 'secco', category: 'Otros', active: true },
  { id: 'secco-chocolatada-200', name: 'Chocolatada Baggio x200cc', providerId: 'secco', category: 'Otros', active: true },
  { id: 'secco-cerveza-descartable-361', name: 'Cerveza descartable 361', providerId: 'secco', category: 'Otros', active: true },
  { id: 'secco-vinas-de-balbo-1250', name: 'Viñas de Balbo x1.250', providerId: 'secco', category: 'Otros', active: true },
  { id: 'secco-bidones-agua-5-litros', name: 'Bidones de agua x5 litros', providerId: 'secco', category: 'Otros', active: true },
  { id: 'secco-pure-tomate-200', name: 'Puré de tomate La Huerta x200', providerId: 'secco', category: 'Otros', active: true },
  { id: 'secco-pure-tomate-530', name: 'Puré de tomate La Huerta x530', providerId: 'secco', category: 'Otros', active: true },

  // =========================
  // M Y M
  // =========================
  { id: 'mym-burger-caja-amarilla-x4', name: 'Burger caja amarilla x4', providerId: 'mym', category: 'Congelados y varios', active: true },
  { id: 'mym-swit-paq-2-rojo', name: 'Swit paq x2 (rojo)', providerId: 'mym', category: 'Congelados y varios', active: true },
  { id: 'mym-potes-helado', name: 'Potes de helado', providerId: 'mym', category: 'Congelados y varios', active: true },

  { id: 'mym-aceitunas-con-carozo', name: 'Con carozo', providerId: 'mym', category: 'Aceitunas', active: true },
  { id: 'mym-aceitunas-sin-carozo', name: 'Sin carozo', providerId: 'mym', category: 'Aceitunas', active: true },
  { id: 'mym-aceitunas-fileteadas', name: 'Fileteadas', providerId: 'mym', category: 'Aceitunas', active: true },
  { id: 'mym-aceitunas-negras', name: 'Negras', providerId: 'mym', category: 'Aceitunas', active: true },

  { id: 'mym-salchichas-la-blanca', name: 'Salchichas La Blanca', providerId: 'mym', category: 'Fiambres', active: true },
  { id: 'mym-jamon-05', name: 'Jamón 05', providerId: 'mym', category: 'Fiambres', active: true },
  { id: 'mym-jamon-grasetto-negra', name: 'Jamón grasetto etiqueta negra', providerId: 'mym', category: 'Fiambres', active: true },
  { id: 'mym-paleta-graseto-azul', name: 'Paleta graseto etiqueta azul', providerId: 'mym', category: 'Fiambres', active: true },
  { id: 'mym-paleta-graseto-roja', name: 'Paleta graseto etiqueta roja', providerId: 'mym', category: 'Fiambres', active: true },
  { id: 'mym-panceta', name: 'Panceta', providerId: 'mym', category: 'Fiambres', active: true },
  { id: 'mym-crespon', name: 'Crespon', providerId: 'mym', category: 'Fiambres', active: true },
  { id: 'mym-salame-milan', name: 'Salame Milan', providerId: 'mym', category: 'Fiambres', active: true },
  { id: 'mym-jamon-verde-grasetto', name: 'Jamón verde grasetto', providerId: 'mym', category: 'Fiambres', active: true },
  { id: 'mym-salamines-picado-fino', name: 'Salamines picado fino', providerId: 'mym', category: 'Fiambres', active: true },
  { id: 'mym-salamines-picado-grueso', name: 'Salamines picado grueso', providerId: 'mym', category: 'Fiambres', active: true },

  // =========================
  // COCA COLA
  // =========================
  { id: 'coca-cola-coca', name: 'Coca', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-cola-coca-zero', name: 'Coca Zero', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-cola-sprite', name: 'Sprite', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-cola-fanta-naranja', name: 'Fanta naranja', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-cola-fanta-pomelo', name: 'Fanta pomelo', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-cola-fanta-limon', name: 'Fanta limón', providerId: 'coca-cola', category: 'Retornable', active: true },
  { id: 'coca-cola-schweppes', name: 'Schweppes', providerId: 'coca-cola', category: 'Retornable', active: true },

  { id: 'coca-cola-descartable-coca', name: 'Coca', providerId: 'coca-cola', category: 'Descartables', active: true },
  { id: 'coca-cola-descartable-coca-zero', name: 'Coca Zero', providerId: 'coca-cola', category: 'Descartables', active: true },
  { id: 'coca-cola-descartable-sprite', name: 'Sprite', providerId: 'coca-cola', category: 'Descartables', active: true },
  { id: 'coca-cola-descartable-fanta', name: 'Fanta', providerId: 'coca-cola', category: 'Descartables', active: true },
  { id: 'coca-cola-descartable-schweppes-pomelo', name: 'Schweppes pomelo', providerId: 'coca-cola', category: 'Descartables', active: true },
  { id: 'coca-cola-descartable-schweppes-tonica', name: 'Schweppes tónica', providerId: 'coca-cola', category: 'Descartables', active: true },

  { id: 'coca-cola-aquarius-pomelo', name: 'Aquarius pomelo', providerId: 'coca-cola', category: 'Aquarius', active: true },
  { id: 'coca-cola-aquarius-manzana', name: 'Aquarius manzana', providerId: 'coca-cola', category: 'Aquarius', active: true },
  { id: 'coca-cola-aquarius-pera', name: 'Aquarius pera', providerId: 'coca-cola', category: 'Aquarius', active: true },
  { id: 'coca-cola-aquarius-naranja', name: 'Aquarius naranja', providerId: 'coca-cola', category: 'Aquarius', active: true },
  { id: 'coca-cola-aquarius-uva', name: 'Aquarius uva', providerId: 'coca-cola', category: 'Aquarius', active: true },

  { id: 'coca-cola-powerade-manzana', name: 'Powerade manzana', providerId: 'coca-cola', category: 'Powerade', active: true },
  { id: 'coca-cola-powerade-azul', name: 'Powerade azul', providerId: 'coca-cola', category: 'Powerade', active: true },
  { id: 'coca-cola-powerade-rojo', name: 'Powerade rojo', providerId: 'coca-cola', category: 'Powerade', active: true },

  { id: 'coca-cola-monster-comun', name: 'Monster común', providerId: 'coca-cola', category: 'Monster', active: true },
  { id: 'coca-cola-monster-light', name: 'Monster light', providerId: 'coca-cola', category: 'Monster', active: true },
  { id: 'coca-cola-monster-mango', name: 'Monster mango', providerId: 'coca-cola', category: 'Monster', active: true },
  { id: 'coca-cola-monster-sunrise', name: 'Monster sunrise', providerId: 'coca-cola', category: 'Monster', active: true },
  { id: 'coca-cola-monster-ur46', name: 'Monster UR 46', providerId: 'coca-cola', category: 'Monster', active: true },

  { id: 'coca-cola-cepita-durazno', name: 'Cepita Durazno', providerId: 'coca-cola', category: 'Cepita', active: true },
  { id: 'coca-cola-cepita-naranja', name: 'Cepita Naranja', providerId: 'coca-cola', category: 'Cepita', active: true },
  { id: 'coca-cola-cepita-multifruta', name: 'Cepita Multifruta', providerId: 'coca-cola', category: 'Cepita', active: true },
  { id: 'coca-cola-cepita-manzana', name: 'Cepita Manzana', providerId: 'coca-cola', category: 'Cepita', active: true },

  { id: 'coca-cola-ades-naranja', name: 'Ades Naranja', providerId: 'coca-cola', category: 'Ades', active: true },
  { id: 'coca-cola-ades-manzana', name: 'Ades Manzana', providerId: 'coca-cola', category: 'Ades', active: true },
  { id: 'coca-cola-ades-durazno', name: 'Ades Durazno', providerId: 'coca-cola', category: 'Ades', active: true },
  { id: 'coca-cola-ades-mifrutal', name: 'Ades Mifrutal', providerId: 'coca-cola', category: 'Ades', active: true },

  { id: 'coca-cola-bonaqua-500cc', name: 'Bonaqua 500cc', providerId: 'coca-cola', category: 'Agua Bonaqua', active: true },
  { id: 'coca-cola-bonaqua-gasificada', name: 'Bonaqua gasificada', providerId: 'coca-cola', category: 'Agua Bonaqua', active: true },
  { id: 'coca-cola-bonaqua-litro-y-medio', name: 'Bonaqua litro y 1/2', providerId: 'coca-cola', category: 'Agua Bonaqua', active: true },
  { id: 'coca-cola-bonaqua-2-litros', name: 'Bonaqua 2 litros', providerId: 'coca-cola', category: 'Agua Bonaqua', active: true },

  // =========================
  // LUCAS
  // =========================
  { id: 'lucas-queso-barra-db', name: 'Queso barra DB', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-cremoso-don-bosco', name: 'Cremoso Don Bosco', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-sardo-casc-negra', name: 'Sardo casc. negra', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-romanito-db', name: 'Romanito DB', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-sbrinz-ltp', name: 'Sbrinz LTP', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-por-salud', name: 'Por salud', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-muzza-severina', name: 'Muzza Severina', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-muzza-cilindro-juan', name: 'Muzza cilindro Juan', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-fimbo-cascara-roja', name: 'Fimbo (cáscara roja)', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-roquefort-quesera', name: 'Roquefort quesera', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-salchichon-primav', name: 'Salchichón primav.', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-queso-cerdo-palad', name: 'Queso cerdo palad.', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-bondiola-don-decimo', name: 'Bondiola Don Decimo', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-matambre-carne', name: 'Matambre de carne', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-queso-cheddar', name: 'Queso cheddar', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-crudo-serranito', name: 'Crudo serranito', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-manteca-100-1er-p', name: 'Manteca x100g 1ER/P', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-manteca-200-1er-p', name: 'Manteca x200g 1ER/P', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-ralladito-quesera', name: 'Ralladito quesera', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-provoletitas', name: 'Provoletitas', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-crema-200-premio', name: 'Crema x200 (1 premio)', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-leche-polvo-400', name: 'Leche polvo x400g', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-batata-dulcor', name: 'Batata Dulcor', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-batata-chocolate', name: 'Batata con chocolate', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-membrillo-dulcor', name: 'Membrillo Dulcor', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-anchoas-lata', name: 'Anchoas lata', providerId: 'lucas', category: 'Quesos y fiambres', active: true },
  { id: 'lucas-grasa-500', name: 'Grasa x500g', providerId: 'lucas', category: 'Quesos y fiambres', active: true },

  // =========================
  // VENECIANA / KALEO
  // =========================
  { id: 'veneciana-pan-lactal-400', name: 'Pan lactal 400g', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-pan-lactal-600', name: 'Pan lactal 600g', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-multicereal', name: 'Multicereal', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-integral', name: 'Integral', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-pan-panchos', name: 'Pan de panchos', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-pan-hamburguesas', name: 'Pan de hamburguesas', providerId: 'veneciana', category: 'Panificados', active: true },
  { id: 'veneciana-practiricas', name: 'Práctiricas', providerId: 'veneciana', category: 'Panificados', active: true },

  { id: 'veneciana-papas-tradicionales-105', name: 'Papas tradicionales 105g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-americanos-105', name: 'Papas americanos 105g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-tradicionales-50', name: 'Papas tradicionales 50g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-americanos-50', name: 'Papas americanos 50g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-cebolla-55', name: 'Papas sabor cebolla 55g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-jamon-55', name: 'Papas sabor jamón 55g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-salame-55', name: 'Papas sabor salame 55g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-ketchup-55', name: 'Papas sabor ketchup 55g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-cheddar-55', name: 'Papas sabor cheddar 55g', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-conos', name: 'Conos', providerId: 'veneciana', category: 'Papas y snacks', active: true },
  { id: 'veneciana-papas-pays', name: 'Papas pays', providerId: 'veneciana', category: 'Papas y snacks', active: true },

  { id: 'veneciana-grisines-trisalvados', name: 'Grisines trisalvados', providerId: 'veneciana', category: 'Grisines', active: true },
  { id: 'veneciana-grisines-con-salvado', name: 'Con salvado', providerId: 'veneciana', category: 'Grisines', active: true },
  { id: 'veneciana-grisines-multicereal', name: 'Multicereal', providerId: 'veneciana', category: 'Grisines', active: true },
  { id: 'veneciana-grisines-clasicos', name: 'Clásicos', providerId: 'veneciana', category: 'Grisines', active: true },
  { id: 'veneciana-zigrinatos', name: 'Zigrinatos', providerId: 'veneciana', category: 'Grisines', active: true },

  { id: 'veneciana-alfajores-cachafaz', name: 'Alfajores Cachafaz', providerId: 'veneciana', category: 'Otros', active: true },
];

async function seedCollection(collectionName, items) {
  for (const item of items) {
    const { id, ...data } = item;
    await setDoc(doc(db, collectionName, id), data);
    console.log(`✅ ${collectionName}/${id}`);
  }
}

async function run() {
  try {
    console.log('🚀 Subiendo products...');
    await seedCollection('products', products);
    console.log('🎉 Products completado.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error subiendo datos:', error);
    process.exit(1);
  }
}

run();