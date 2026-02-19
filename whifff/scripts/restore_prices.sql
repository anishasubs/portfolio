-- Restore prices for well-known perfumes
-- These are approximate retail USD prices

UPDATE perfumes SET price_usd = 110, price_range = '$$' WHERE name = 'Miss Dior Blooming Bouquet' AND brand = 'Dior';
UPDATE perfumes SET price_usd = 142, price_range = '$$' WHERE name = 'Black Opium' AND brand = 'Yves Saint Laurent';
UPDATE perfumes SET price_usd = 325, price_range = '$$$' WHERE name = 'Baccarat Rouge 540' AND brand = 'Maison Francis Kurkdjian';
UPDATE perfumes SET price_usd = 135, price_range = '$$' WHERE name = 'Flowerbomb' AND brand = 'Viktor & Rolf';
UPDATE perfumes SET price_usd = 135, price_range = '$$' WHERE name = 'Flowerbomb' AND brand = 'Viktor Rolf';
UPDATE perfumes SET price_usd = 160, price_range = '$$' WHERE name = 'Chance Eau Tendre' AND brand = 'Chanel';
UPDATE perfumes SET price_usd = 120, price_range = '$$' WHERE name = 'Good Girl' AND brand = 'Carolina Herrera';
UPDATE perfumes SET price_usd = 44, price_range = '$' WHERE name = 'Cloud' AND brand = 'Ariana Grande';
UPDATE perfumes SET price_usd = 310, price_range = '$$$' WHERE name = 'Delina' AND brand = 'Parfums de Marly';
UPDATE perfumes SET price_usd = 78, price_range = '$' WHERE name = 'Brazilian Bum Bum Cream' AND brand = 'Sol de Janeiro';
UPDATE perfumes SET price_usd = 115, price_range = '$$' WHERE name = 'La Vie Est Belle' AND brand = 'Lancome';
UPDATE perfumes SET price_usd = 115, price_range = '$$' WHERE name ILIKE 'la vie est belle' AND brand ILIKE 'lanc%me';
UPDATE perfumes SET price_usd = 69, price_range = '$' WHERE name = 'Glossier You' AND brand = 'Glossier';
UPDATE perfumes SET price_usd = 155, price_range = '$$' WHERE name ILIKE 'j''adore' AND brand = 'Dior';
UPDATE perfumes SET price_usd = 98, price_range = '$' WHERE name ILIKE 'kayali vanilla%28' AND brand ILIKE 'kayali';
UPDATE perfumes SET price_usd = 138, price_range = '$$' WHERE name = 'Libre' AND brand = 'Yves Saint Laurent';
UPDATE perfumes SET price_usd = 108, price_range = '$$' WHERE name ILIKE 'burberry her' AND brand = 'Burberry';
UPDATE perfumes SET price_usd = 78, price_range = '$' WHERE name ILIKE 'cheirosa 71' AND brand ILIKE 'sol de janeiro';
UPDATE perfumes SET price_usd = 165, price_range = '$$' WHERE name = 'Coco Mademoiselle' AND brand = 'Chanel';
UPDATE perfumes SET price_usd = 95, price_range = '$' WHERE name = 'Not a Perfume' AND brand = 'Juliette Has a Gun';
UPDATE perfumes SET price_usd = 124, price_range = '$$' WHERE name = 'Mon Guerlain' AND brand = 'Guerlain';
UPDATE perfumes SET price_usd = 88, price_range = '$' WHERE name = 'Daisy' AND brand = 'Marc Jacobs';

-- Also set prices for popular perfumes from the Kaggle dataset
UPDATE perfumes SET price_usd = 105, price_range = '$$' WHERE name ILIKE 'sauvage' AND brand ILIKE 'dior' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 150, price_range = '$$' WHERE name = 'Bleu de Chanel' AND brand = 'Chanel' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 89, price_range = '$' WHERE name ILIKE '1 million' AND brand ILIKE 'paco rabanne' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 95, price_range = '$' WHERE name = 'Light Blue' AND brand ILIKE 'dolce%gabbana' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 120, price_range = '$$' WHERE name = 'Acqua di Gio Profumo' AND brand ILIKE 'giorgio armani' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 180, price_range = '$$' WHERE name ILIKE 'aventus' AND brand ILIKE 'creed' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 84, price_range = '$' WHERE name = 'Versace Eros' AND brand ILIKE 'versace' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 135, price_range = '$$' WHERE name ILIKE 'tobacco vanille' AND brand ILIKE 'tom ford' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 74, price_range = '$' WHERE name ILIKE 'si' AND brand ILIKE 'giorgio armani' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 68, price_range = '$' WHERE name ILIKE 'bombshell' AND brand ILIKE 'victoria%secret' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 182, price_range = '$$' WHERE name = 'Lost Cherry' AND brand ILIKE 'tom ford' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 100, price_range = '$$' WHERE name ILIKE 'la nuit de l%homme' AND brand ILIKE 'yves saint laurent' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 150, price_range = '$$' WHERE name ILIKE 'ombre leather' AND brand ILIKE 'tom ford' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 120, price_range = '$$' WHERE name = 'Santal 33' AND brand ILIKE 'le labo' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 155, price_range = '$$' WHERE name ILIKE 'black orchid' AND brand ILIKE 'tom ford' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 90, price_range = '$' WHERE name ILIKE 'narciso rodriguez for her' AND brand ILIKE 'narciso rodriguez' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 90, price_range = '$' WHERE name ILIKE 'dolce%gabbana the one' AND brand ILIKE 'dolce%gabbana' AND price_usd IS NULL;
UPDATE perfumes SET price_usd = 245, price_range = '$$$' WHERE name ILIKE 'grand soir' AND brand ILIKE 'maison francis kurkdjian' AND price_usd IS NULL;
