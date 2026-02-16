-- Assign prices to ALL perfumes by brand tier
-- Run in Supabase SQL Editor

-- Step 1: Luxury brands -> $$$ (~$275)
UPDATE perfumes
SET price_range = '$$$', price_usd = 275
WHERE LOWER(brand) IN (
  'maison francis kurkdjian', 'tom ford', 'creed', 'xerjoff',
  'parfums de marly', 'roja dove', 'amouage', 'boadicea the victorious',
  'clive christian', 'bond no 9', 'kilian', 'initio parfums prives',
  'initio', 'tiziana terenzi', 'nishane', 'memo paris', 'byredo',
  'le labo', 'frederic malle', 'diptyque', 'penhaligon s', 'penhaligons',
  'm micallef', 'widian', 'floris london', 'floris', 'atelier cologne',
  'acqua di parma', 'serge lutens', 'profumum roma',
  'orto parisi', 'nasomatto', 'vilhelm parfumerie',
  'montale', 'mancera', 'juliette has a gun',
  'parfums dusita', 'electimuss', 'sospiro', 'moresque',
  'fueguia 1833', 'hiram green', 'maison margiela',
  'house of oud', 'chris collins', 'goldfield banks'
)
AND (price_usd IS NULL OR price_usd <= 0);

-- Step 2: Affordable brands -> $ (~$55)
UPDATE perfumes
SET price_range = '$', price_usd = 55
WHERE LOWER(brand) IN (
  'avon', 'zara', 'o boticario', 'natura', 'oriflame',
  'bath body works', 'bath & body works', 'armaf',
  'victoria s secret', 'victoria''s secret',
  'jeanne arthes', 'faberlic', 'yves rocher', 'brocard', 'coty',
  'elizabeth arden', 'clean', 'ariana grande', 'billie eilish',
  'sol de janeiro', 'glossier', 'the body shop', 'gap', 'adidas',
  'nike', 'revlon', 'britney spears', 'jennifer lopez',
  'paris hilton', 'david beckham', 'playboy', 'benetton', 'nautica',
  'ed hardy', 'hollister', 'abercrombie fitch',
  'al haramain perfumes', 'rasasi', 'lattafa perfumes',
  'swiss arabian', 'ajmal', 'afnan', 'ard al zaafaran', 'al rehab',
  'kayali', 'juicy couture', 'marc jacobs', 'commodity',
  'philosophy', 'skylar', 'ellis brooklyn', 'phlur', 'dedcool',
  'rihanna', 'nicki minaj', 'sarah jessica parker',
  'kim kardashian', 'jessica simpson', 'taylor swift',
  'fragonard', 'l occitane en provence'
)
AND (price_usd IS NULL OR price_usd <= 0);

-- Step 3: Everything else -> designer $$ (~$135)
UPDATE perfumes
SET price_range = '$$', price_usd = 135
WHERE price_usd IS NULL OR price_usd <= 0;
